import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import banner from "../../assets/dashboard-banner.png"

const PRIMARY = '#122C41'
const ACCENT  = '#1e88e5'
const FONT    = "'Inter', 'Segoe UI', sans-serif"

const Icon = ({ d, size = 16, color = 'currentColor', fill = 'none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

const ic = {
  search:   'M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z',
  print:    'M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z',
  export:   'M12 3v12M8 11l4 4 4-4M3 17v1a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-1',
  external: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3',
  filter:   'M22 3H2l8 9.46V19l4 2v-8.54L22 3z',
  x:        'M18 6L6 18M6 6l12 12',
  clock:    'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zM12 6v6l4 2',
  gear:     'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z',
  check:    'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3',
  plus:     'M12 5v14M5 12h14',
  download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
  refresh:  'M20 12a8 8 0 1 1-8-8M12 4l2 2-2 2',
}

const fmt = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n ?? 0)
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'2-digit', year:'numeric' }).replace(/\//g,'/') : '—'

const STATUS_CONFIG = {
  HOLD:        { label: 'On Hold',     color: '#f59e0b', bg: '#fffbeb', icon: ic.clock },
  IN_PROGRESS: { label: 'In Progress', color: '#1e88e5', bg: '#eff6ff', icon: ic.gear  },
  COMPLETED:   { label: 'Completed',   color: '#10b981', bg: '#ecfdf5', icon: ic.check },
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: '#6b7280', bg: '#f3f4f6', icon: ic.gear }
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:20, background:cfg.bg, color:cfg.color, fontSize:12, fontWeight:600, fontFamily:FONT, whiteSpace:'nowrap' }}>
      <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d={cfg.icon} />
      </svg>
      {cfg.label}
    </span>
  )
}

function getDocumentCount(order) {
  // This should be replaced with actual document count from your API
  // For now, return null to hide the documents column
  return null
}

export default function OrderList({ basePath = "/orders", showSalesRep = false, showPriority = false }) {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [location, setLocation] = useState('')
  const [contactSearch, setContactSearch] = useState('')
  const [orderDate, setOrderDate] = useState('')
  const [deliveryDate, setDeliveryDate] = useState('')
  const [salesRepSearch, setSalesRepSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders/orders/')
      const ordersData = response.data?.results ?? response.data ?? []
      // Sort by created_at in descending order (most recent first)
      const sortedOrders = [...ordersData].sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      )
      setOrders(sortedOrders)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetFilters = () => {
    setSearch('')
    setLocation('')
    setContactSearch('')
    setOrderDate('')
    setDeliveryDate('')
    setSalesRepSearch('')
    setPriorityFilter('')
    setStatusFilter('')
  }

  const counts = {
    HOLD:        orders.filter(o => o.status === 'HOLD').length,
    IN_PROGRESS: orders.filter(o => o.status === 'IN_PROGRESS').length,
    COMPLETED:   orders.filter(o => o.status === 'COMPLETED').length,
  }

  const filtered = orders.filter(o => {
    const customer = o.customer_detail?.company_name ?? ''
    const num      = o.order_number ?? ''
    const contact  = o.customer_detail?.telephone_primary ?? ''
    const region   = o.customer_detail?.region ?? ''
    const status   = o.status ?? ''
    const orderDateVal = o.created_at ? new Date(o.created_at).toLocaleDateString() : ''
    const deliveryDateVal = o.oa?.commercial_terms?.schedule_dispatch_date 
      ? new Date(o.oa.commercial_terms.schedule_dispatch_date).toLocaleDateString() 
      : ''
    
    // Sales rep and priority (only if needed for manager view)
    const salesRep = o.oa?.quotation?.enquiry?.assigned_to?.user?.first_name 
      ? `${o.oa.quotation.enquiry.assigned_to.user.first_name} ${o.oa.quotation.enquiry.assigned_to.user.last_name || ''}`.trim()
      : (o.oa?.quotation?.enquiry?.assigned_to?.username || '')
    const priority = o.oa?.quotation?.enquiry?.priority
    
    // Search filters
    if (search && !customer.toLowerCase().includes(search.toLowerCase()) && !num.toLowerCase().includes(search.toLowerCase())) return false
    if (location && !region.toLowerCase().includes(location.toLowerCase())) return false
    if (contactSearch && !contact.includes(contactSearch)) return false
    if (statusFilter && status !== statusFilter) return false
    if (orderDate && orderDateVal !== new Date(orderDate).toLocaleDateString()) return false
    if (deliveryDate && deliveryDateVal !== new Date(deliveryDate).toLocaleDateString()) return false
    if (showSalesRep && salesRepSearch && !salesRep.toLowerCase().includes(salesRepSearch.toLowerCase())) return false
    if (showPriority && priorityFilter && priority !== priorityFilter) return false
    
    return true
  })

  // Column definitions based on view type
  const columns = [
    { key: 'order_number', label: 'Order Number', width: 'auto' },
    { key: 'po_number', label: 'PO Number', width: 'auto' },
    { key: 'order_date', label: 'Order Date', width: 'auto' },
    { key: 'delivery_date', label: 'Delivery Date', width: 'auto' },
    { key: 'entity_name', label: 'Entity Name', width: 'auto' },
    { key: 'contact_detail', label: 'Contact Detail', width: 'auto' },
    { key: 'location', label: 'Location', width: 'auto' },
    ...(showSalesRep ? [{ key: 'sales_rep', label: 'Sales Rep', width: 'auto' }] : []),
    ...(showPriority ? [{ key: 'priority', label: 'Priority', width: 'auto' }] : []),
    { key: 'amount', label: 'Amount', width: 'auto' },
    { key: 'status', label: 'Status', width: 'auto' },
  ]

  return (
    <div style={{ fontFamily: FONT, minHeight: '100vh', background: '#f5f7fa' }}>
      {/* Header Banner */}
      <div style={{
        backgroundImage: `linear-gradient(125deg, rgba(13,31,48,0.7) 0%, rgba(18,44,65,0.6) 40%, rgba(26,74,110,0.4) 100%), url(${banner})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        borderRadius: 16,
        padding: '28px 32px 80px',
        position: 'relative',
        overflow: 'visible',
        marginBottom: 64,
      }}>
        <div style={{
          display:'flex',
          justifyContent:'space-between',
          alignItems:'flex-start',
          position:'relative',
          zIndex:1
        }}>
          <div>
            <p style={{
              margin:'0 0 4px',
              color:'rgba(255,255,255,.5)',
              fontSize:11.5,
              fontWeight:600,
              letterSpacing:'.1em',
              textTransform:'uppercase'
            }}>
              Order Management
            </p>
            <h1 style={{
              margin:0,
              fontSize:30,
              fontWeight:700,
              color:'#fff',
              letterSpacing:'-0.02em'
            }}>
              Orders
              <span style={{
                fontSize:20,
                fontWeight:400,
                opacity:.55
              }}>
                {" "}({orders.length})
              </span>
            </h1>
          </div>

          <button
            onClick={() => navigate(`${basePath}/new`)}
            style={{
              display:'flex',
              alignItems:'center',
              gap:8,
              padding:'10px 18px',
              borderRadius:10,
              border:'none',
              background:'#fff',
              color:PRIMARY,
              fontWeight:600,
              fontSize:13,
              cursor:'pointer'
            }}
          >
            <Icon d={ic.plus} size={14} color={PRIMARY} />
            New Order
          </button>
        </div>

        {/* Stats Cards */}
        <div style={{
          display:'grid',
          gridTemplateColumns:'repeat(3,1fr)',
          gap:16,
          position:'absolute',
          bottom:-54,
          left:32,
          right:32,
          zIndex:10
        }}>
          {[
            { key:'HOLD', label:'Order On Hold', icon: ic.clock },
            { key:'IN_PROGRESS', label:'Order In Progress', icon: ic.gear },
            { key:'COMPLETED', label:'Order Completed', icon: ic.check },
          ].map((s,i)=>(
            <div
              key={i}
              style={{
                background:'#fff',
                borderRadius:12,
                padding:'16px 20px',
                boxShadow:'0 4px 20px rgba(0,0,0,.09)',
                cursor: 'pointer',
                transition: 'transform 0.2s',
              }}
              onClick={() => setStatusFilter(s.key)}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{
                display:'flex',
                alignItems:'center',
                justifyContent:'space-between',
                marginBottom:10
              }}>
                <span style={{
                  fontSize:12.5,
                  fontWeight:600,
                  color:'#6b7280'
                }}>
                  {s.label}
                </span>
                <div style={{
                  width:32,
                  height:32,
                  borderRadius:8,
                  background:`${ACCENT}15`,
                  display:'flex',
                  alignItems:'center',
                  justifyContent:'center'
                }}>
                  <Icon d={s.icon} size={15} color={ACCENT}/>
                </div>
              </div>
              <div style={{
                fontSize:28,
                fontWeight:700,
                color:PRIMARY,
                letterSpacing:'-0.02em'
              }}>
                {counts[s.key]}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding:'24px 32px' }}>
        {/* Order Data Table Card */}
        <div style={{ background:'#fff', borderRadius:14, boxShadow:'0 1px 8px rgba(0,0,0,.07)', overflow:'hidden' }}>
          {/* Table header */}
          <div style={{ padding:'18px 24px', borderBottom:'1px solid #f0f2f5', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:15, fontWeight:700, color:PRIMARY }}>Order Data</span>
              <Icon d={ic.external} size={14} color={ACCENT} />
            </div>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              <button 
                onClick={() => window.print()}
                style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 16px', borderRadius:8, border:'1.5px solid #e5e7eb', background:'#fff', color:'#374151', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:FONT }}
              >
                <Icon d={ic.print} size={14} color="#374151" /> Print
              </button>
              <button 
                onClick={() => {
                  // Export to Excel functionality
                  const csv = filtered.map(o => ({
                    'Order Number': o.order_number,
                    'PO Number': o.oa?.oa_number || '—',
                    'Order Date': fmtDate(o.created_at),
                    'Delivery Date': o.oa?.commercial_terms?.schedule_dispatch_date ? fmtDate(o.oa.commercial_terms.schedule_dispatch_date) : '—',
                    'Entity Name': o.customer_detail?.company_name || '—',
                    'Contact Detail': o.customer_detail?.telephone_primary || '—',
                    'Location': o.customer_detail?.region || '—',
                    'Amount': fmt(o.total_value),
                    'Status': o.status || '—',
                  }))
                  console.log('Export data:', csv)
                  alert('Export functionality coming soon')
                }}
                style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 16px', borderRadius:8, border:'1.5px solid #e5e7eb', background:'#fff', color:'#374151', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:FONT }}
              >
                <Icon d={ic.export} size={14} color="#374151" /> Export to Excel
              </button>
              <button 
                onClick={resetFilters}
                style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 16px', borderRadius:8, border:'1.5px solid #e5e7eb', background:'#fff', color:'#374151', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:FONT }}
              >
                <Icon d={ic.refresh} size={14} color="#374151" /> Reset Filters
              </button>
            </div>
          </div>

          {/* Filters */}
          <div style={{ padding:'16px 24px', borderBottom:'1px solid #f0f2f5', display:'flex', gap:12, flexWrap:'wrap', alignItems:'flex-end' }}>
            {[
              { label:'Search Order', placeholder:'Customer / Order #', value:search, setter:setSearch, type:'text' },
              { label:'Location', placeholder:'Enter Location', value:location, setter:setLocation, type:'text' },
              { label:'Contact Number', placeholder:'Enter Contact', value:contactSearch, setter:setContactSearch, type:'text' },
              { label:'Order Date', placeholder:'Select Date', value:orderDate, setter:setOrderDate, type:'date' },
              { label:'Delivery Date', placeholder:'Select Date', value:deliveryDate, setter:setDeliveryDate, type:'date' },
              ...(showSalesRep ? [{ label:'Sales Rep', placeholder:'Sales Rep Name', value:salesRepSearch, setter:setSalesRepSearch, type:'text' }] : []),
            ].map(f => (
              <div key={f.label} style={{ position:'relative', flex:'1 1 140px', minWidth:130 }}>
                <span style={{ position:'absolute', top:-9, left:10, background:'#fff', padding:'0 4px', fontSize:10.5, fontWeight:600, color:'#9ca3af', zIndex:1, letterSpacing:'.04em', textTransform:'uppercase', whiteSpace:'nowrap' }}>{f.label}</span>
                <input
                  type={f.type}
                  value={f.value}
                  onChange={e => f.setter(e.target.value)}
                  placeholder={f.placeholder}
                  style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:13, fontFamily:FONT, color:'#111827', outline:'none', boxSizing:'border-box' }}
                />
              </div>
            ))}
            
            {/* Status Filter Dropdown */}
            <div style={{ position:'relative', flex:'1 1 140px', minWidth:130 }}>
              <span style={{ position:'absolute', top:-9, left:10, background:'#fff', padding:'0 4px', fontSize:10.5, fontWeight:600, color:'#9ca3af', zIndex:1, letterSpacing:'.04em', textTransform:'uppercase', whiteSpace:'nowrap' }}>Status</span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:13, fontFamily:FONT, color:'#111827', outline:'none', boxSizing:'border-box', background:'#fff' }}
              >
                <option value="">All Statuses</option>
                <option value="HOLD">On Hold</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            {/* Priority Filter (only for manager view) */}
            {showPriority && (
              <div style={{ position:'relative', flex:'1 1 140px', minWidth:130 }}>
                <span style={{ position:'absolute', top:-9, left:10, background:'#fff', padding:'0 4px', fontSize:10.5, fontWeight:600, color:'#9ca3af', zIndex:1, letterSpacing:'.04em', textTransform:'uppercase', whiteSpace:'nowrap' }}>Priority</span>
                <select
                  value={priorityFilter}
                  onChange={e => setPriorityFilter(e.target.value)}
                  style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:13, fontFamily:FONT, color:'#111827', outline:'none', boxSizing:'border-box', background:'#fff' }}
                >
                  <option value="">All Priorities</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
            )}

            <button 
              onClick={() => {}}
              style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 18px', borderRadius:8, border:'none', background:PRIMARY, color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:FONT, whiteSpace:'nowrap' }}
            >
              <Icon d={ic.search} size={14} color="#fff" /> Search
            </button>
            <button 
              onClick={() => {}}
              style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 16px', borderRadius:8, border:'1.5px solid #e5e7eb', background:'#fff', color:'#374151', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:FONT }}
            >
              <Icon d={ic.filter} size={14} /> Filters
            </button>
          </div>

          {/* Table */}
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#f8fafc' }}>
                  {columns.map(col => (
                    <th key={col.key} style={{ padding:'12px 16px', textAlign:'left', fontSize:12.5, fontWeight:700, color:PRIMARY, borderBottom:'2px solid #e9ecf0', whiteSpace:'nowrap' }}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={columns.length} style={{ padding:48, textAlign:'center', color:'#9ca3af', fontSize:14 }}>
                      Loading orders…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} style={{ padding:48, textAlign:'center', color:'#9ca3af', fontSize:14 }}>
                      No orders found.
                    </td>
                  </tr>
                ) : filtered.map((o, i) => {
                  const customer = o.customer_detail
                  const poc = customer?.pocs?.[0]
                  const salesRep = o.oa?.quotation?.enquiry?.assigned_to?.user?.first_name 
                    ? `${o.oa.quotation.enquiry.assigned_to.user.first_name} ${o.oa.quotation.enquiry.assigned_to.user.last_name || ''}`.trim()
                    : (o.oa?.quotation?.enquiry?.assigned_to?.username || '—')
                  const priority = o.oa?.quotation?.enquiry?.priority
                  
                  return (
                    <tr
                      key={o.id}
                      onClick={() => navigate(`${basePath}/${o.id}`)}
                      style={{ borderBottom:'1px solid #f0f2f5', cursor:'pointer', transition:'background .12s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={td}><span style={{ fontWeight:700, color:ACCENT }}>{o.order_number}</span></td>
                      <td style={td}><span style={{ color:'#374151' }}>{o.oa?.oa_number ?? '—'}</span></td>
                      <td style={td}>{fmtDate(o.created_at)}</td>
                      <td style={td}>{o.oa?.commercial_terms?.schedule_dispatch_date ? fmtDate(o.oa.commercial_terms.schedule_dispatch_date) : '—'}</td>
                      <td style={td}><span style={{ fontWeight:600, color:'#111827' }}>{customer?.company_name ?? '—'}</span></td>
                      <td style={td}>{poc?.phone ?? customer?.telephone_primary ?? '—'}</td>
                      <td style={td}>{customer?.region ?? customer?.city ?? '—'}</td>
                      {showSalesRep && (
                        <td style={td}><span style={{ fontWeight:500, color:'#374151' }}>{salesRep}</span></td>
                      )}
                      {showPriority && (
                        <td style={td}>
                          {priority ? (
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: 12,
                              fontSize: 11,
                              fontWeight: 600,
                              background: priority === 'HIGH' ? '#fee2e2' : priority === 'MEDIUM' ? '#fef3c7' : '#dcfce7',
                              color: priority === 'HIGH' ? '#dc2626' : priority === 'MEDIUM' ? '#d97706' : '#16a34a'
                            }}>
                              {priority}
                            </span>
                          ) : '—'}
                        </td>
                      )}
                      <td style={td}><span style={{ fontWeight:700, color:'#111827' }}>{fmt(o.total_value)}</span></td>
                      <td style={td}><StatusBadge status={o.status} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Footer with pagination info */}
          {filtered.length > 0 && (
            <div style={{ padding: '16px 24px', borderTop: '1px solid #f0f2f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: '#6b7280' }}>
              <span>Showing {filtered.length} of {orders.length} orders</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button 
                  onClick={() => {}}
                  style={{ padding: '4px 8px', border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff', cursor: 'pointer' }}
                >
                  Previous
                </button>
                <span style={{ padding: '4px 8px' }}>Page 1</span>
                <button 
                  onClick={() => {}}
                  style={{ padding: '4px 8px', border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff', cursor: 'pointer' }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const td = { padding:'13px 16px', fontSize:13.5, color:'#374151', verticalAlign:'middle', whiteSpace:'nowrap' }