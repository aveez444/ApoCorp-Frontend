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
  clock:  'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6v6l4 2',
  send:   'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
  check:  'M20 6L9 17l-5-5',
  dollar: 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
}

const fmt = n => new Intl.NumberFormat('en-IN').format(n ?? 0)

// Views map to proforma statuses (or orders without proforma)
const VIEWS = {
  PENDING: 'pending',  // Orders that don't have a proforma yet
  DRAFT:   'draft',    // Proforma DRAFT
  SENT:    'sent',     // Proforma SENT / PARTIAL / PAID
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
    { key: VIEWS.PENDING, label: 'Pending Invoice',   icon: ic.clock,  color: '#f59e0b', bg: '#fffbeb' },
    { key: VIEWS.DRAFT,   label: 'Draft Invoice',      icon: ic.send,   color: ACCENT,    bg: '#e2f1ff' },
    { key: VIEWS.SENT,    label: 'Payment Received',   icon: ic.check,  color: '#16a34a', bg: '#f0fdf4' },
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

export default function ProformaList({ basePath = '/employee/proforma-invoices' }) {
  const navigate = useNavigate()

  const [pendingOrders,   setPendingOrders]   = useState([])   // orders without proforma
  const [draftProformas,  setDraftProformas]  = useState([])
  const [sentProformas,   setSentProformas]   = useState([])
  const [loading,         setLoading]         = useState(true)
  const [creatingFor,     setCreatingFor]     = useState(null)  // order id being initialized

  const [view,     setView]     = useState(VIEWS.PENDING)
  const [search,   setSearch]   = useState('')
  const [location, setLocation] = useState('')
  const [contact,  setContact]  = useState('')
  const [date,     setDate]     = useState('')
  const [page,     setPage]     = useState(1)
  const PAGE = 15

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [ordRes, draftRes, sentRes] = await Promise.all([
        api.get('/orders/orders/'),
        api.get('/proforma/?status=DRAFT'),
        api.get('/proforma/?status=SENT,PARTIAL,PAID'),
      ])

      const allOrders = ordRes.data?.results  || ordRes.data  || []
      const drafts    = draftRes.data?.results || draftRes.data || []
      const sents     = sentRes.data?.results  || sentRes.data  || []

      // Order IDs that already have a proforma (any status except cancelled)
      const allProforma = [...drafts, ...sents]
      const ordersWithProforma = new Set(allProforma.map(p => p.order))

      setPendingOrders(allOrders.filter(o => !ordersWithProforma.has(o.id)))
      setDraftProformas(drafts)
      setSentProformas(sents)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const filterOrder = o => {
    const c = o.customer_detail || {}
    return (
      (!search   || o.order_number?.toLowerCase().includes(search.toLowerCase()) || c.company_name?.toLowerCase().includes(search.toLowerCase())) &&
      (!location || c.city?.toLowerCase().includes(location.toLowerCase())       || c.country?.toLowerCase().includes(location.toLowerCase())) &&
      (!contact  || c.telephone_primary?.includes(contact) || c.email?.toLowerCase().includes(contact.toLowerCase())) &&
      (!date     || o.created_at?.slice(0, 10) === date)
    )
  }

  const filterProforma = p => {
    const c = p.customer_detail || {}
    return (
      (!search   || p.proforma_number?.toLowerCase().includes(search.toLowerCase()) || p.order_number?.toLowerCase().includes(search.toLowerCase()) || c.company_name?.toLowerCase().includes(search.toLowerCase())) &&
      (!location || c.city?.toLowerCase().includes(location.toLowerCase())           || c.country?.toLowerCase().includes(location.toLowerCase())) &&
      (!contact  || c.telephone_primary?.includes(contact) || c.email?.toLowerCase().includes(contact.toLowerCase())) &&
      (!date     || p.invoice_date === date || p.created_at?.slice(0, 10) === date)
    )
  }

  const activeList = view === VIEWS.PENDING ? pendingOrders
                   : view === VIEWS.DRAFT   ? draftProformas
                   : sentProformas

  const activeRows = (view === VIEWS.PENDING ? activeList.filter(filterOrder) : activeList.filter(filterProforma))
  const paginated  = activeRows.slice((page - 1) * PAGE, page * PAGE)
  const totalPages = Math.ceil(activeRows.length / PAGE)

  const counts = {
    [VIEWS.PENDING]: pendingOrders.length,
    [VIEWS.DRAFT]:   draftProformas.length,
    [VIEWS.SENT]:    sentProformas.length,
  }

  // For pending orders: call initialize endpoint → navigate to proforma detail
  const handleRowClick = async row => {
    if (view !== VIEWS.PENDING) {
      navigate(`${basePath}/${row.id}`)
      return
    }
    setCreatingFor(row.id)
    try {
      const res = await api.post('/proforma/initialize/', { order: row.id })
      navigate(`${basePath}/${res.data.id}`)
    } catch (e) {
      alert(e.response?.data ? JSON.stringify(e.response.data, null, 2) : 'Failed to create proforma')
    } finally {
      setCreatingFor(null)
    }
  }

  const handleExport = () => {
    const headers = view === VIEWS.PENDING
      ? ['Order Number', 'OA Number', 'Date', 'Customer Name', 'Contact', 'Location', 'Amount', 'Status']
      : ['Proforma Number', 'Order Number', 'Invoice Date', 'Customer Name', 'Contact', 'Location', 'Amount', 'Status']
    const rows = activeRows.map(r => view === VIEWS.PENDING
      ? [r.order_number, r.oa_number || '', r.created_at?.slice(0,10), r.customer_detail?.company_name, r.customer_detail?.telephone_primary, [r.customer_detail?.city, r.customer_detail?.country].filter(Boolean).join(', '), r.total_value, r.status]
      : [r.proforma_number, r.order_number, r.invoice_date, r.customer_detail?.company_name, r.customer_detail?.telephone_primary, [r.customer_detail?.city, r.customer_detail?.country].filter(Boolean).join(', '), r.total_amount, r.status]
    )
    const csv = [headers, ...rows].map(r => r.map(v => `"${v ?? ''}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `proforma-${view}.csv`
    a.click()
  }

  const statusBadge = (status, label) => {
    const cfg = {
      IN_PROGRESS: { color: '#1e88e5', bg: '#e2f1ff', label: 'In Progress' },
      COMPLETED:   { color: '#16a34a', bg: '#f0fdf4', label: 'Completed' },
      HOLD:        { color: '#f59e0b', bg: '#fffbeb', label: 'On Hold' },
      DRAFT:       { color: '#f59e0b', bg: '#fffbeb', label: 'Draft' },
      SENT:        { color: '#1e88e5', bg: '#e2f1ff', label: 'Sent' },
      PARTIAL:     { color: '#7c3aed', bg: '#f3e8ff', label: 'Partial' },
      PAID:        { color: '#16a34a', bg: '#f0fdf4', label: 'Paid' },
      CANCELLED:   { color: '#6b7280', bg: '#f9fafb', label: 'Cancelled' },
    }[status] || { color: '#6b7280', bg: '#f9fafb', label: label || status }
    return (
      <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11.5, fontWeight: 700, color: cfg.color, background: cfg.bg }}>
        {cfg.label}
      </span>
    )
  }

  const bannerConfig = {
    [VIEWS.PENDING]: { subtitle: 'Click any order to auto-create a Proforma Invoice — line items will be pre-filled.', countLabel: 'Pending' },
    [VIEWS.DRAFT]:   { subtitle: 'Draft proforma invoices — review and send to customer.', countLabel: 'Drafts' },
    [VIEWS.SENT]:    { subtitle: 'Sent invoices — track payment status here.', countLabel: 'Sent / Paid' },
  }[view]

  const colHeaders = view === VIEWS.PENDING
    ? ['Order Number', 'OA Number', 'Order Date', 'Customer Name', 'Contact', 'Location', 'Amount', 'Order Status']
    : ['Proforma Number', 'Order Number', 'Invoice Date', 'Customer Name', 'Contact', 'Location', 'Amount', 'Invoice Status']

  const renderRow = (row, i) => {
    const c  = row.customer_detail || {}
    const bg = { background: i % 2 === 0 ? '#fafafa' : '#fff', borderBottom: '1px solid #f3f4f6', transition: 'background .1s' }
    const isCreating = creatingFor === row.id

    if (view === VIEWS.PENDING) {
      return (
        <tr key={row.id} className="row-hover" onClick={() => !isCreating && handleRowClick(row)} style={{ ...bg, opacity: isCreating ? .6 : 1 }}>
          <td style={{ ...tdStyle, color: PRIMARY, fontWeight: 700, fontFamily: 'monospace', fontSize: 12.5 }}>{row.order_number || '—'}</td>
          <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 12.5, color: '#6b7280' }}>{row.oa_number || '—'}</td>
          <td style={tdStyle}>{row.created_at ? new Date(row.created_at).toLocaleDateString('en-IN') : '—'}</td>
          <td style={{ ...tdStyle, fontWeight: 600, color: '#111827' }}>{c.company_name || '—'}</td>
          <td style={{ ...tdStyle, color: ACCENT }}>{c.telephone_primary || c.email || '—'}</td>
          <td style={tdStyle}>{[c.city, c.country].filter(Boolean).join(', ') || '—'}</td>
          <td style={{ ...tdStyle, fontWeight: 600 }}>₹{fmt(row.total_value)}</td>
          <td style={tdStyle}>{isCreating ? <span style={{ fontSize: 12, color: '#9ca3af' }}>Creating…</span> : statusBadge(row.status)}</td>
        </tr>
      )
    }

    return (
      <tr key={row.id} className="row-hover" onClick={() => handleRowClick(row)} style={bg}>
        <td style={{ ...tdStyle, color: PRIMARY, fontWeight: 700, fontFamily: 'monospace', fontSize: 12.5 }}>{row.proforma_number || '—'}</td>
        <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 12.5, color: '#6b7280' }}>{row.order_number || '—'}</td>
        <td style={tdStyle}>{row.invoice_date || '—'}</td>
        <td style={{ ...tdStyle, fontWeight: 600, color: '#111827' }}>{c.company_name || '—'}</td>
        <td style={{ ...tdStyle, color: ACCENT }}>{c.telephone_primary || c.email || '—'}</td>
        <td style={tdStyle}>{[c.city, c.country].filter(Boolean).join(', ') || '—'}</td>
        <td style={{ ...tdStyle, fontWeight: 600 }}>₹{fmt(row.total_amount)}</td>
        <td style={tdStyle}>{statusBadge(row.status)}</td>
      </tr>
    )
  }

  const emptyMsg = {
    [VIEWS.PENDING]: { title: 'No orders pending invoicing', sub: 'Orders converted from OA will appear here.' },
    [VIEWS.DRAFT]:   { title: 'No draft proforma invoices', sub: 'Click an order in the "Pending Invoice" tab to auto-create one.' },
    [VIEWS.SENT]:    { title: 'No sent invoices', sub: 'Proforma invoices that have been sent to the customer will appear here.' },
  }[view]

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
            Proforma Invoice&nbsp;
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
            <button onClick={handleExport}         style={outlineBtn}><Icon d={ic.export} size={14} color="#6b7280" /> Export</button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <FloatingInput label="Search"   value={search}   onChange={v => { setSearch(v);   setPage(1) }} placeholder="Order No / Proforma No / Customer" />
          <FloatingInput label="Location" value={location} onChange={v => { setLocation(v); setPage(1) }} placeholder="City / Country" />
          <FloatingInput label="Contact"  value={contact}  onChange={v => { setContact(v);  setPage(1) }} placeholder="Phone / Email" />
          <FloatingInput label="Date"     value={date}     onChange={v => { setDate(v);     setPage(1) }} type="date" />
          <button style={searchBtn}><Icon d={ic.search} size={14} color="#fff" /> Search</button>
          <button style={outlineBtn}><Icon d={ic.filter} size={14} color="#6b7280" /> Filters</button>
        </div>
      </div>

      {/* TABLE */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 8px rgba(0,0,0,.06)', overflow: 'hidden', animation: 'fadeUp .3s ease' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900, fontSize: 13.5 }}>
            <thead>
              <tr style={{ background: PRIMARY }}>
                {colHeaders.map(h => <th key={h} style={thStyle}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ padding: 48, textAlign: 'center', color: '#9ca3af' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    <div style={{ width: 18, height: 18, border: '2px solid #e5e7eb', borderTopColor: PRIMARY, borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
                    Loading…
                  </div>
                </td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: 48, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
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
                const pg = page <= 4 ? i + 1 : page + i - 3
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

const thStyle   = { padding: '12px 16px', color: '#fff', fontWeight: 600, textAlign: 'left', whiteSpace: 'nowrap', fontSize: 13, fontFamily: FONT, borderRight: '1px solid rgba(255,255,255,.08)' }
const tdStyle   = { padding: '12px 16px', color: '#374151', borderRight: '1px solid #f3f4f6', whiteSpace: 'nowrap', verticalAlign: 'middle' }
const outlineBtn = { display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', border: '1.5px solid #e5e7eb', borderRadius: 8, background: '#fff', color: '#4b5563', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: FONT, whiteSpace: 'nowrap' }
const searchBtn  = { display: 'flex', alignItems: 'center', gap: 6, padding: '10px 22px', borderRadius: 8, border: 'none', background: ACCENT, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONT, whiteSpace: 'nowrap' }
const pgBtn = (disabled, active = false) => ({ minWidth: 34, height: 34, borderRadius: 7, border: '1.5px solid', borderColor: active ? PRIMARY : '#e5e7eb', background: active ? PRIMARY : '#fff', color: active ? '#fff' : disabled ? '#d1d5db' : '#4b5563', fontSize: 13, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, opacity: disabled ? .5 : 1, padding: '0 8px' })