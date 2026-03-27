import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import banner from '../../assets/dashboard-banner.png'

const PRIMARY = '#122C41'
const ACCENT  = '#1e88e5'
const FONT    = "'Inter', 'Segoe UI', sans-serif"

const Icon = ({ d, size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

const ic = {
  print:  'M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z',
  export: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
  search: 'M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z',
  filter: 'M22 3H2l8 9.46V19l4 2v-8.54z',
  chevR:  'M9 18l6-6-6-6',
  chevL:  'M15 18l-6-6 6-6',
  doc:    'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6',
  clock:  'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6v6l4 2',
  send:   'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
}

const fmt = n => new Intl.NumberFormat('en-IN').format(n ?? 0)

const VIEWS = {
  PENDING: 'pending',
  DRAFT:   'draft',
  SENT:    'sent',
}

// Priority flags component
const PRIORITY_COLORS = { LOW: '#22c55e', MEDIUM: '#f59e0b', HIGH: '#ef4444' }
const PRIORITY_ORDER  = ['LOW', 'MEDIUM', 'HIGH']

function FlagIcon({ active, color, size = 15 }) {
  const c = active ? color : '#D1D5DB'
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <line x1="4" y1="2" x2="4" y2="18" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4 3.5 L15.5 3.5 Q16.5 3.5 16 4.5 L13.5 8.5 L16 12.5 Q16.5 13.5 15.5 13.5 L4 13.5 Z" fill={c} />
    </svg>
  )
}

function PriorityFlags({ priority }) {
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'center', justifyContent: 'center' }}>
      {PRIORITY_ORDER.map(p => (
        <FlagIcon key={p} active={priority === p} color={PRIORITY_COLORS[p]} size={15} />
      ))}
    </div>
  )
}

function FloatingInput({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div style={{ position: 'relative', flex: '1 1 180px', minWidth: 160 }}>
      <span style={{ position: 'absolute', top: -9, left: 10, background: '#fff', padding: '0 4px', fontSize: 11, fontWeight: 600, color: '#9ca3af', fontFamily: FONT, zIndex: 1, letterSpacing: '.04em', textTransform: 'uppercase' }}>{label}</span>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 13.5, fontFamily: FONT, color: '#111827', background: '#fff', boxSizing: 'border-box' }} />
    </div>
  )
}

function ViewToggle({ active, onChange, counts }) {
  const tabs = [
    { key: VIEWS.PENDING, label: 'Ready for OA', icon: ic.doc,   color: '#16a34a', bg: '#f0fdf4' },
    { key: VIEWS.DRAFT,   label: 'Draft OA',      icon: ic.clock, color: '#f59e0b', bg: '#fffbeb' },
    { key: VIEWS.SENT,    label: 'Sent OA',        icon: ic.send,  color: ACCENT,    bg: '#e2f1ff' },
  ]
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {tabs.map(t => {
        const isActive = active === t.key
        return (
          <button key={t.key} onClick={() => onChange(t.key)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 9, border: `1.5px solid ${isActive ? t.color : '#e5e7eb'}`, background: isActive ? t.bg : '#fff', color: isActive ? t.color : '#6b7280', fontSize: 13, fontWeight: isActive ? 700 : 500, cursor: 'pointer', fontFamily: FONT, transition: 'all .15s' }}>
            <Icon d={t.icon} size={14} color={isActive ? t.color : '#9ca3af'} />
            {t.label}
            {counts[t.key] !== undefined && (
              <span style={{ background: isActive ? t.color : '#e5e7eb', color: isActive ? '#fff' : '#6b7280', borderRadius: 99, fontSize: 11, fontWeight: 700, padding: '1px 7px', minWidth: 20, textAlign: 'center' }}>
                {counts[t.key]}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// Helper functions for manager-specific data
function resolveSalesRep(row) {
  const detail = row.assigned_to_detail || row.enquiry_detail?.assigned_to_detail
  if (detail) {
    return [detail.first_name, detail.last_name].filter(Boolean).join(' ') || detail.username || '—'
  }
  return row.transport_details?.sales_rep || '—'
}

function activityDays(row) {
  const ts = row.enquiry_detail?.last_activity_at || row.last_activity_at
  if (!ts) return null
  return Math.floor((Date.now() - new Date(ts)) / 86400000)
}

export default function ManagerOAList({ basePath = '/manager/order-acknowledgements' }) {
  const navigate = useNavigate()

  // Same as employee side - fetch OAs by status
  const [pendingOAs, setPendingOAs] = useState([])
  const [draftOAs, setDraftOAs] = useState([])
  const [sentOAs, setSentOAs] = useState([])
  const [loading, setLoading] = useState(true)

  const [view, setView] = useState(VIEWS.PENDING)
  const [search, setSearch] = useState('')
  const [location, setLocation] = useState('')
  const [contact, setContact] = useState('')
  const [date, setDate] = useState('')
  const [page, setPage] = useState(1)
  const PAGE = 15

  // Fetch all three lists in parallel using status filter - same as employee side
  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [pendingRes, draftRes, sentRes] = await Promise.all([
        api.get('/orders/oa/?status=PENDING'),
        api.get('/orders/oa/?status=DRAFT'),
        api.get('/orders/oa/?status=CONVERTED'),
      ])
      setPendingOAs(pendingRes.data?.results || pendingRes.data || [])
      setDraftOAs(draftRes.data?.results || draftRes.data || [])
      setSentOAs(sentRes.data?.results || sentRes.data || [])
    } catch (err) {
      console.error('Error fetching OA data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // Filter function - same as employee side
  const filterOA = oa => {
    const c = oa.customer_detail || {}
    return (
      (!search || oa.oa_number?.toLowerCase().includes(search.toLowerCase()) ||
                  oa.quotation_number?.toLowerCase().includes(search.toLowerCase()) ||
                  c.company_name?.toLowerCase().includes(search.toLowerCase())) &&
      (!location || c.city?.toLowerCase().includes(location.toLowerCase()) ||
                    c.country?.toLowerCase().includes(location.toLowerCase())) &&
      (!contact || c.telephone_primary?.includes(contact) ||
                   c.email?.toLowerCase().includes(contact.toLowerCase())) &&
      (!date || oa.created_at?.slice(0, 10) === date)
    )
  }

  const activeList = view === VIEWS.PENDING ? pendingOAs
                   : view === VIEWS.DRAFT   ? draftOAs
                   : sentOAs

  const activeRows = activeList.filter(filterOA)
  const paginated = activeRows.slice((page - 1) * PAGE, page * PAGE)
  const totalPages = Math.ceil(activeRows.length / PAGE)

  const counts = {
    [VIEWS.PENDING]: pendingOAs.length,
    [VIEWS.DRAFT]:   draftOAs.length,
    [VIEWS.SENT]:    sentOAs.length,
  }

  const handleRowClick = row => {
    navigate(`${basePath}/${row.id}`)
  }

  const handleExport = () => {
    const headers = ['OA Number', 'Quotation Number', 'PO Number', 'PO Date', 'Date', 'Customer Name', 'Contact', 'Location', 'Sales Rep', 'Activity Days', 'Amount', 'Status', 'Priority']
    const rows = activeRows.map(oa => {
      const c = oa.customer_detail || {}
      const tr = oa.transport_details || {}
      return [
        oa.oa_number || '',
        oa.quotation_number || '',
        tr.customer_po_number || oa.po_number || '',
        tr.po_date ? new Date(tr.po_date).toLocaleDateString('en-IN') : (oa.po_date ? new Date(oa.po_date).toLocaleDateString('en-IN') : ''),
        oa.created_at ? new Date(oa.created_at).toLocaleDateString('en-IN') : '',
        c.company_name || '',
        c.telephone_primary || c.email || '',
        [c.city, c.country].filter(Boolean).join(', '),
        resolveSalesRep(oa),
        activityDays(oa) ?? '',
        oa.total_value || 0,
        oa.status || '',
        oa.priority || '',
      ]
    })
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `manager-oa-${view}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  }

  const statusBadge = status => {
    const cfg = {
      PENDING:   { color: '#16a34a', bg: '#f0fdf4', label: 'Ready for OA' },
      DRAFT:     { color: '#f59e0b', bg: '#fffbeb', label: 'Draft OA' },
      CONVERTED: { color: '#1e88e5', bg: '#e2f1ff', label: 'Sent' },
      CANCELLED: { color: '#6b7280', bg: '#f9fafb', label: 'Cancelled' },
    }[status] || { color: '#6b7280', bg: '#f9fafb', label: status }
    return (
      <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11.5, fontWeight: 700, color: cfg.color, background: cfg.bg }}>
        {cfg.label}
      </span>
    )
  }

  const bannerConfig = {
    [VIEWS.PENDING]: { subtitle: 'Pre-filled OAs ready for review — click any row to view details.', countLabel: 'Ready for OA' },
    [VIEWS.DRAFT]:   { subtitle: 'These OAs are saved as draft. Click any row to continue editing.', countLabel: 'Draft OAs' },
    [VIEWS.SENT]:    { subtitle: 'These OAs have been shared and converted to Orders.', countLabel: 'Sent OAs' },
  }[view]

  const emptyMsg = {
    [VIEWS.PENDING]: { title: 'No OAs ready for review', sub: 'OAs created from accepted quotations will appear here.' },
    [VIEWS.DRAFT]:   { title: 'No draft OAs', sub: 'OAs saved as draft will appear here.' },
    [VIEWS.SENT]:    { title: 'No sent OAs', sub: 'OAs that have been shared and converted to orders will appear here.' },
  }[view]

  // Manager columns - includes Sales Rep, Activity Days, Priority
  const colHeaders = ['OA Number', 'Quotation Number', 'PO Number', 'PO Date', 'Customer Name', 'Status', 'Sales Rep', 'Delivery Date', 'Contact', 'Location', 'Activity Days', 'Amount (₹)', 'Priority']

  const renderRow = (row, i) => {
    const c = row.customer_detail || {}
    const tr = row.transport_details || {}
    const bg = { background: i % 2 === 0 ? '#fafafa' : '#fff', borderBottom: '1px solid #f3f4f6', transition: 'background .1s' }

    const poNumber = tr.customer_po_number || row.po_number || '—'
    const poDate = tr.po_date ? new Date(tr.po_date).toLocaleDateString('en-IN') : (row.po_date ? new Date(row.po_date).toLocaleDateString('en-IN') : '—')
    const entityName = c.company_name || '—'
    const salesRep = resolveSalesRep(row)
    const delivDate = tr.delivery_date ? new Date(tr.delivery_date).toLocaleDateString('en-IN') : (row.delivery_date ? new Date(row.delivery_date).toLocaleDateString('en-IN') : '—')
    const phone = c.telephone_primary || c.email || '—'
    const loc = [c.city, c.country].filter(Boolean).join(', ') || '—'
    const days = activityDays(row)
    const amount = row.total_value || 0
    const priority = row.priority || row.enquiry_detail?.priority || null

    const tdStyle = { padding: '12px 16px', color: '#374151', borderRight: '1px solid #f3f4f6', whiteSpace: 'nowrap', verticalAlign: 'middle' }

    return (
      <tr key={row.id} className="row-hover" onClick={() => handleRowClick(row)} style={bg}>
        <td style={{ ...tdStyle, color: PRIMARY, fontWeight: 700, fontFamily: 'monospace', fontSize: 12.5 }}>{row.oa_number || '—'}</td>
        <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 12.5, color: '#6b7280' }}>{row.quotation_number || '—'}</td>
        <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 12.5 }}>
          {poNumber !== '—' ? (
            <span style={{ color: '#16a34a', fontWeight: 600 }}>{poNumber}</span>
          ) : (
            <span style={{ color: '#f59e0b', fontSize: 12, fontStyle: 'italic' }}>Not entered</span>
          )}
        </td>
        <td style={tdStyle}>{poDate}</td>
        <td style={{ ...tdStyle, fontWeight: 600, color: '#111827' }}>{entityName}</td>
        <td style={tdStyle}>{statusBadge(row.status)}</td>
        <td style={tdStyle}>{salesRep}</td>
        <td style={tdStyle}>{delivDate}</td>
        <td style={{ ...tdStyle, color: ACCENT }}>{phone}</td>
        <td style={tdStyle}>{loc}</td>
        <td style={{ ...tdStyle, textAlign: 'center' }}>
          {days !== null ? (
            <span style={{ fontWeight: 700, color: days > 7 ? '#ef4444' : days > 3 ? '#f59e0b' : PRIMARY }}>{days} days</span>
          ) : '—'}
        </td>
        <td style={{ ...tdStyle, fontWeight: 600 }}>₹{fmt(amount)}</td>
        <td style={{ ...tdStyle, textAlign: 'center' }}><PriorityFlags priority={priority} /></td>
      </tr>
    )
  }

  return (
    <div style={{ fontFamily: FONT }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: none } }
        .row-hover:hover { background: #f0f5ff !important; cursor: pointer; }
        input:focus { outline: none; border-color: ${ACCENT}!important; box-shadow: 0 0 0 3px ${ACCENT}18!important; }
        ::-webkit-scrollbar { height: 5px; width: 5px } ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 99px }
      `}</style>

      {/* BANNER */}
      <div style={{ backgroundImage: `url(${banner})`, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: 16, padding: '28px 32px', marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(120deg, rgba(18,44,65,0.85) 0%, rgba(18,44,65,0.7) 60%, rgba(26,74,110,0.65) 100%)', borderRadius: 16 }} />
        <div style={{ position: 'absolute', right: -60, top: -60, width: 260, height: 260, borderRadius: '50%', background: 'rgba(255,255,255,.03)', zIndex: 1 }} />
        <div style={{ position: 'relative', zIndex: 2 }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
            Order Acknowledgement&nbsp;
            <span style={{ fontSize: 18, fontWeight: 400, opacity: .7 }}>({fmt(activeRows.length)} {bannerConfig.countLabel})</span>
          </h1>
          <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,.8)', fontSize: 13.5 }}>{bannerConfig.subtitle}</p>
        </div>
      </div>

      {/* TOOLBAR */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 8px rgba(0,0,0,.06)', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <ViewToggle active={view} onChange={v => { setView(v); setPage(1) }} counts={counts} />
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => window.print()} style={outlineBtn}><Icon d={ic.print} size={14} color="#6b7280" /> Print</button>
            <button onClick={handleExport} style={outlineBtn}><Icon d={ic.export} size={14} color="#6b7280" /> Export</button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <FloatingInput label="Search" value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="OA Number / Quotation / Customer" />
          <FloatingInput label="Location" value={location} onChange={v => { setLocation(v); setPage(1) }} placeholder="City / Country" />
          <FloatingInput label="Contact" value={contact} onChange={v => { setContact(v); setPage(1) }} placeholder="Phone / Email" />
          <FloatingInput label="Date" value={date} onChange={v => { setDate(v); setPage(1) }} placeholder="Created Date" type="date" />
          <button style={searchBtn}><Icon d={ic.search} size={14} color="#fff" /> Search</button>
          <button style={outlineBtn}><Icon d={ic.filter} size={14} color="#6b7280" /> Filters</button>
        </div>
      </div>

      {/* TABLE */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 8px rgba(0,0,0,.06)', overflow: 'hidden', animation: 'fadeUp .3s ease' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1400, fontSize: 13.5 }}>
            <thead>
              <tr style={{ background: PRIMARY }}>
                {colHeaders.map(h => <th key={h} style={thStyle}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={colHeaders.length} style={{ padding: 48, textAlign: 'center', color: '#9ca3af' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    <div style={{ width: 18, height: 18, border: '2px solid #e5e7eb', borderTopColor: PRIMARY, borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
                    Loading…
                  </div>
                </td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={colHeaders.length} style={{ padding: 48, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, color: '#374151' }}>{emptyMsg.title}</div>
                  <div style={{ fontSize: 12.5 }}>{emptyMsg.sub}</div>
                </td></tr>
              ) : paginated.map((row, i) => renderRow(row, i))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 20px', borderTop: '1px solid #f3f4f6' }}>
            <span style={{ fontSize: 13, color: '#6b7280' }}>Showing {(page - 1) * PAGE + 1}–{Math.min(page * PAGE, activeRows.length)} of {fmt(activeRows.length)}</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={pgBtn(page === 1)}>
                <Icon d={ic.chevL} size={14} />
              </button>
              {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                let pg = page <= 4 ? i + 1 : page + i - 3
                if (pg < 1 || pg > totalPages) return null
                return <button key={pg} onClick={() => setPage(pg)} style={pgBtn(false, pg === page)}>{pg}</button>
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={pgBtn(page === totalPages)}>
                <Icon d={ic.chevR} size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const thStyle = { padding: '12px 16px', color: '#fff', fontWeight: 600, textAlign: 'left', whiteSpace: 'nowrap', fontSize: 13, fontFamily: FONT, borderRight: '1px solid rgba(255,255,255,.08)' }
const outlineBtn = { display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', border: '1.5px solid #e5e7eb', borderRadius: 8, background: '#fff', color: '#4b5563', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: FONT, whiteSpace: 'nowrap' }
const searchBtn = { display: 'flex', alignItems: 'center', gap: 6, padding: '10px 22px', borderRadius: 8, border: 'none', background: ACCENT, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONT, whiteSpace: 'nowrap' }
const pgBtn = (disabled, active = false) => ({ minWidth: 34, height: 34, borderRadius: 7, border: '1.5px solid', borderColor: active ? PRIMARY : '#e5e7eb', background: active ? PRIMARY : '#fff', color: active ? '#fff' : disabled ? '#d1d5db' : '#4b5563', fontSize: 13, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, opacity: disabled ? .5 : 1, padding: '0 8px' })