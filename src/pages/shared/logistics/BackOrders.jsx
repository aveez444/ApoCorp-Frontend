// pages/shared/logistics/BackOrders.jsx
import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../../api/axios'
import banner from '../../../assets/dashboard-banner.png'

const PRIMARY = '#122C41'
const BORDER  = '#e2e8f0'
const FONT    = "'Inter', 'Segoe UI', sans-serif"

const fmtAmt = n =>
  `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n ?? 0)}`

const fmt = n => new Intl.NumberFormat('en-IN').format(n ?? 0)

function fmtDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Status configs ──────────────────────────────────────────────────────────────
const INVOICE_STATUS = {
  NOT_INVOICED:       { bg: '#fffbe6', color: '#c8860a', dot: '#f0a500', label: 'Not Invoiced' },
  PARTIALLY_INVOICED: { bg: '#e6f0ff', color: '#1a7fd4', dot: '#1a7fd4', label: 'Partially Invoiced' },
  FULLY_INVOICED:     { bg: '#e6fff5', color: '#0a9e6e', dot: '#0fc878', label: 'Fully Invoiced' },
}

const BO_STATUS = {
  PENDING:    { bg: '#fffbe6', color: '#c8860a', dot: '#f0a500', label: 'Pending' },
  DISPATCHED: { bg: '#e6f0ff', color: '#1a7fd4', dot: '#1a7fd4', label: 'Dispatched' },
  INVOICED:   { bg: '#e6fff5', color: '#0a9e6e', dot: '#0fc878', label: 'Invoiced' },
  CANCELLED:  { bg: '#fef2f2', color: '#dc2626', dot: '#ef4444', label: 'Cancelled' },
}

// ── Tiny helpers ────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

const ic = {
  arrowLeft:  'M19 12H5M12 19l-7-7 7-7',
  search:     'M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z',
  clear:      'M4 4l16 16M4 20L20 4',
  export:     'M3 3h18v18H3zM3 9h18M3 15h18M9 3v18',
  print:      'M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z',
  invoice:    'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6',
  arrowRight: 'M5 12h14M12 5l7 7-7 7',
}

function StatusBadge({ status, map }) {
  const s = map[status] || { bg: '#f1f5f9', color: '#475569', dot: '#94a3b8', label: status || '—' }
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
      display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.dot, display: 'inline-block' }} />
      {s.label}
    </span>
  )
}

function CategoryBadge({ category }) {
  const isDomestic = category === 'DOMESTIC'
  return (
    <span style={{
      background: isDomestic ? '#e8f5e9' : '#e3f2fd',
      color:      isDomestic ? '#2e7d32' : '#1565c0',
      padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
      display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap',
    }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        {isDomestic ? (
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        ) : (
          <path d="M21 16v-2a4 4 0 00-4-4H5m0 0l3-3m-3 3l3 3M3 12h13a4 4 0 014 4v2" />
        )}
      </svg>
      {isDomestic ? 'Domestic' : 'Export'}
    </span>
  )
}

// ── TABS ────────────────────────────────────────────────────────────────────────
const TABS = [
  { key: '',           label: 'All' },
  { key: 'PENDING',    label: 'Pending' },
  { key: 'DISPATCHED', label: 'Dispatched' },
  { key: 'INVOICED',   label: 'Invoiced' },
  { key: 'CANCELLED',  label: 'Cancelled' },
]

// ── Main Component ──────────────────────────────────────────────────────────────
export default function BackOrders({ role = 'manager' }) {
  const navigate = useNavigate()

  const [backOrders, setBackOrders] = useState([])
  const [loading, setLoading]       = useState(true)
  const [activeTab, setActiveTab]   = useState('')

  // filters
  const [searchBO, setSearchBO]     = useState('')
  const [searchOrder, setSearchOrder] = useState('')
  const [dateFrom, setDateFrom]     = useState('')

  const fetchBackOrders = useCallback(async () => {
    try {
      setLoading(true)
      const params = {}
      if (activeTab)    params.status     = activeTab
      if (searchBO)     params.bo_number  = searchBO
      if (searchOrder)  params.order_number = searchOrder
      if (dateFrom)     params.date_from  = dateFrom

      const res = await api.get('/logistics/back-orders/', { params })
      setBackOrders(res.data?.results ?? res.data ?? [])
    } catch (err) {
      console.error('Error fetching back orders:', err)
    } finally {
      setLoading(false)
    }
  }, [activeTab, searchBO, searchOrder, dateFrom])

  useEffect(() => { fetchBackOrders() }, [fetchBackOrders])

  // Debounced search for smooth UX
  const [debouncedBO, setDebouncedBO] = useState('')
  const [debouncedOrder, setDebouncedOrder] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedBO(searchBO), 400)
    return () => clearTimeout(timer)
  }, [searchBO])
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedOrder(searchOrder), 400)
    return () => clearTimeout(timer)
  }, [searchOrder])
  useEffect(() => { fetchBackOrders() }, [debouncedBO, debouncedOrder, dateFrom])

  const clearFilters = () => {
    setSearchBO('')
    setSearchOrder('')
    setDateFrom('')
  }

  const handleExport = () => {
    const headers = ['BO Number', 'Order Number', 'PO Number', 'Entity Name', 'Category',
                     'Dispatch Date', 'Total Qty', 'Invoiced Qty', 'Value', 'BO Status', 'Invoice Status']
    const rows = backOrders.map(b => [
      b.back_order_number || '', b.order_number || '', b.po_number || '',
      b.entity_name || '', b.order_category || '',
      b.expected_dispatch_date || '', b.total_quantity || '',
      b.invoiced_quantity || '', b.total_value || '',
      b.status || '', b.invoice_status || '',
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `back_orders_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  }

  const hasFilters = searchBO || searchOrder || dateFrom

  return (
    <div style={{ fontFamily: FONT, background: '#f8fafc', minHeight: '100vh', paddingBottom: 48 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        
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

        .tab-btn {
          background: transparent;
          border: none;
          padding: 8px 20px;
          font-size: 13px;
          font-weight: 500;
          color: #64748b;
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.15s;
          font-family: ${FONT};
        }
        .tab-btn:hover { background: #f1f5f9; color: ${PRIMARY}; }
        .tab-btn.active {
          background: ${PRIMARY};
          color: #fff;
          font-weight: 600;
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
        thead th:last-child { border-radius: 0 8px 0 0; }

        tbody td {
          padding: 13px 16px;
          font-size: 13px;
          color: #374151;
          border-bottom: 1px solid #f1f5f9;
          white-space: nowrap;
        }
        tbody tr:last-child td { border-bottom: none; }
        
        .row-hover { transition: background 0.15s; }
        .row-hover:hover { background: #f8fafc; cursor: pointer; }
        .row-hover:hover td { border-color: #e2e8f0; }

        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* BANNER SECTION */}
      <div style={{
        backgroundImage: `url(${banner})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        borderRadius: 16,
        padding: "28px 32px 40px",
        position: "relative",
        margin: "24px 32px 0",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(120deg,rgba(18,44,65,.72),rgba(18,44,65,.4))",
          borderRadius: 16
        }} />

        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          position: "relative", zIndex: 2
        }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, color: "rgba(255,255,255,.6)", marginBottom: 6, textTransform: "uppercase" }}>
              Outbound Fulfilment
            </p>
            <h1 style={{ color: "#fff", fontSize: 26, margin: 0, fontWeight: 700, letterSpacing: "-0.3px" }}>
              Back Orders
            </h1>
            <p style={{ color: "rgba(255,255,255,.8)", fontSize: 13, marginTop: 6, marginBottom: 0 }}>
              All dispatch records — track status, quantities &amp; invoice state
            </p>
          </div>
          <button
            onClick={() => navigate(`/${role}/logistics/pending-invoices`)}
            style={{
              background: "#fff",
              border: "none",
              padding: "11px 22px",
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              color: PRIMARY,
              fontFamily: FONT,
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Pending Invoices
          </button>
        </div>
      </div>

      {/* MAIN TABLE CARD */}
      <div style={{
        background: "#fff",
        border: `1px solid ${BORDER}`,
        borderRadius: 14,
        padding: "24px",
        boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
        margin: "32px"
      }}>

        {/* TABS */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20, flexWrap: "wrap", borderBottom: `1px solid ${BORDER}`, paddingBottom: 12 }}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* FILTERS ROW */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1.8fr 1.8fr 1.2fr auto auto",
          gap: 12,
          marginBottom: 16,
          alignItems: "end"
        }}>
          <div style={{ position: "relative" }}>
            <span className="filter-label">Back Order No.</span>
            <input
              className="filter-input"
              placeholder="e.g. BO-2024001"
              value={searchBO}
              onChange={e => setSearchBO(e.target.value)}
            />
          </div>
          <div style={{ position: "relative" }}>
            <span className="filter-label">Order Number</span>
            <input
              className="filter-input"
              placeholder="e.g. ORD-2024001"
              value={searchOrder}
              onChange={e => setSearchOrder(e.target.value)}
            />
          </div>
          <div style={{ position: "relative" }}>
            <span className="filter-label">Date From</span>
            <input
              type="date"
              className="filter-input"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
            />
          </div>
          <button className="btn-primary" onClick={fetchBackOrders}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            Search
          </button>
          <button className="btn-secondary" onClick={clearFilters}>
            <svg width="14" height="14" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="4" x2="20" y2="20" />
              <line x1="4" y1="20" x2="20" y2="4" />
            </svg>
            Clear
          </button>
        </div>

        {/* ACTIVE FILTER CHIPS */}
        {hasFilters && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {searchBO && (
              <span className="tag-chip">BO: {searchBO}<button onClick={() => setSearchBO('')}>×</button></span>
            )}
            {searchOrder && (
              <span className="tag-chip">Order: {searchOrder}<button onClick={() => setSearchOrder('')}>×</button></span>
            )}
            {dateFrom && (
              <span className="tag-chip">From: {dateFrom}<button onClick={() => setDateFrom('')}>×</button></span>
            )}
          </div>
        )}

        {/* TOP BAR WITH COUNT AND ACTIONS */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: 16
        }}>
          <div style={{ fontSize: 13, color: "#64748b" }}>
            Showing {backOrders.length} dispatch{backOrders.length !== 1 ? 'es' : ''}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn-outline" onClick={() => window.print()}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z" />
              </svg>
              Print
            </button>
            <button className="btn-outline" onClick={handleExport}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18M9 3v18" />
              </svg>
              Export
            </button>
          </div>
        </div>

        {/* TABLE */}
        <div style={{ overflowX: 'auto', borderRadius: 10, border: `1px solid ${BORDER}` }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {['BO Number', 'Order Number', 'PO Number', 'Entity Name', 'Category',
                  'Dispatch Date', 'Items', 'Total Qty', 'Value', 'BO Status', 'Invoice Status'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <div style={{ width: 18, height: 18, border: `2px solid ${BORDER}`, borderTopColor: PRIMARY, borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
                      Loading back orders...
                    </div>
                  </td>
                </tr>
              ) : backOrders.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>
                    <div>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
                        <path d="M9 12h6m-6 4h6m2-10h.01M5 4h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />
                      </svg>
                      <p style={{ marginTop: 12 }}>No back orders found</p>
                    </div>
                  </td>
                </tr>
              ) : backOrders.map((bo, idx) => (
                <tr
                  key={bo.id || idx}
                  className="row-hover"
                  onClick={() => navigate(`/${role}/logistics/back-orders/${bo.id}`)}
                >
                  <td>
                    <span style={{ fontWeight: 700, color: PRIMARY, fontFamily: 'monospace', fontSize: 13 }}>
                      {bo.back_order_number || '—'}
                    </span>
                  </td>
                  <td style={{ color: '#64748b', fontFamily: 'monospace' }}>{bo.order_number || '—'}</td>
                  <td style={{ fontWeight: 600, color: '#1e293b', fontFamily: 'monospace' }}>{bo.po_number || '—'}</td>
                  <td style={{ fontWeight: 500, color: '#1e293b', maxWidth: 180 }}>
                    <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {bo.entity_name || '—'}
                    </span>
                  </td>
                  <td><CategoryBadge category={bo.order_category} /></td>
                  <td style={{ color: '#374151' }}>{fmtDate(bo.expected_dispatch_date)}</td>
                  <td style={{ textAlign: 'center', color: '#64748b', fontWeight: 600 }}>{bo.line_items_count ?? bo.line_items?.length ?? '—'}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: '#1e293b' }}>{fmt(bo.total_dispatching_quantity ?? bo.total_quantity)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: PRIMARY }}>
                    {bo.total_value ? fmtAmt(bo.total_value) : '—'}
                  </td>
                  <td><StatusBadge status={bo.status} map={BO_STATUS} /></td>
                  <td><StatusBadge status={bo.invoice_status} map={INVOICE_STATUS} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}