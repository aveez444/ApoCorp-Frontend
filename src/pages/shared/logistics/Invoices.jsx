// pages/shared/logistics/Invoices.jsx
import { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../../api/axios'
import banner from '../../../assets/dashboard-banner.png'

const PRIMARY = '#122C41'
const BORDER  = '#e2e8f0'
const FONT    = "'Inter', 'Segoe UI', sans-serif"

const fmtAmt = n => `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n ?? 0)}`

function fmtDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Status configs ──────────────────────────────────────────────────────────────

const INV_STATUS = {
  DRAFT:     { bg: '#fffbe6', color: '#c8860a', dot: '#f0a500', label: 'Draft' },
  CONFIRMED: { bg: '#e6fff5', color: '#0a9e6e', dot: '#0fc878', label: 'Confirmed' },
  CANCELLED: { bg: '#fef2f2', color: '#dc2626', dot: '#ef4444', label: 'Cancelled' },
}

const INVOICE_TYPE_LABELS = {
  Manufacturing: 'Manufacturing',
  Excise: 'Excise',
  Service: 'Service',
  Trading: 'Trading',
}

// ── Helpers ────────────────────────────────────────────────────────────────────

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
  invoice:    'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6',
  eye:        'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6',
  print:      'M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z',
}

function StatusBadge({ status }) {
  const s = INV_STATUS[status] || { bg: '#f1f5f9', color: '#475569', dot: '#94a3b8', label: status || '—' }
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
      display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.dot }} />
      {s.label}
    </span>
  )
}

function CategoryBadge({ category }) {
  const isDomestic = category === 'DOMESTIC'
  return (
    <span style={{
      background: isDomestic ? '#e8f5e9' : '#e3f2fd',
      color: isDomestic ? '#2e7d32' : '#1565c0',
      padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600,
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
  { key: '',          label: 'All' },
  { key: 'DRAFT',     label: 'Draft' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'CANCELLED', label: 'Cancelled' },
]

// ── Summary Cards (matching PendingInvoices style) ──────────────────────────────

function StatCard({ label, value, highlight }) {
  return (
    <div style={{
      background: "#fff",
      border: highlight ? `1.5px solid #fca5a5` : `1px solid ${BORDER}`,
      borderRadius: 12,
      padding: "20px 22px",
      display: "flex",
      flexDirection: "column",
      gap: 6,
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)"
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ margin: 0, fontSize: 13, color: "#64748b", fontWeight: 500 }}>
          {label}
        </p>
      </div>
      <h2 style={{ margin: 0, fontSize: 32, fontWeight: 700, color: highlight ? "#dc2626" : PRIMARY, letterSpacing: "-0.5px" }}>
        {value}
      </h2>
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────────────────────────

export default function Invoices({ role = 'manager' }) {
  const navigate = useNavigate()

  const [invoices, setInvoices] = useState([])
  const [loading, setLoading]   = useState(true)
  const [activeTab, setActiveTab] = useState('')

  const [searchInv, setSearchInv]   = useState('')
  const [searchOrder, setSearchOrder] = useState('')
  const [searchEntity, setSearchEntity] = useState('')
  const [dateFrom, setDateFrom]     = useState('')

  // Debounced search values for better performance
  const [debouncedInv, setDebouncedInv] = useState('')
  const [debouncedOrder, setDebouncedOrder] = useState('')
  const [debouncedEntity, setDebouncedEntity] = useState('')
  const [debouncedDate, setDebouncedDate] = useState('')

  // Debounce effects
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedInv(searchInv), 400)
    return () => clearTimeout(timer)
  }, [searchInv])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedOrder(searchOrder), 400)
    return () => clearTimeout(timer)
  }, [searchOrder])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedEntity(searchEntity), 400)
    return () => clearTimeout(timer)
  }, [searchEntity])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedDate(dateFrom), 400)
    return () => clearTimeout(timer)
  }, [dateFrom])

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true)
      const params = {}
      if (activeTab)    params.status        = activeTab
      if (debouncedInv)    params.invoice_number = debouncedInv
      if (debouncedOrder)  params.order_number   = debouncedOrder
      if (debouncedEntity) params.entity_name    = debouncedEntity
      if (debouncedDate)     params.date_from      = debouncedDate

      const res = await api.get('/logistics/invoices/', { params })
      setInvoices(res.data?.results ?? res.data ?? [])
    } catch (err) {
      console.error('Error fetching invoices:', err)
    } finally {
      setLoading(false)
    }
  }, [activeTab, debouncedInv, debouncedOrder, debouncedEntity, debouncedDate])

  useEffect(() => { fetchInvoices() }, [fetchInvoices])

  const clearFilters = () => {
    setSearchInv('')
    setSearchOrder('')
    setSearchEntity('')
    setDateFrom('')
    setDebouncedInv('')
    setDebouncedOrder('')
    setDebouncedEntity('')
    setDebouncedDate('')
  }

  // Manual search trigger
  const handleManualSearch = () => {
    setDebouncedInv(searchInv)
    setDebouncedOrder(searchOrder)
    setDebouncedEntity(searchEntity)
    setDebouncedDate(dateFrom)
  }

  const handleExport = () => {
    const headers = ['Invoice No.', 'Order No.', 'Back Order No.', 'Entity Name', 'Category',
                     'Invoice Date', 'Invoice Type', 'PO Number', 'Amount', 'Status']
    const rows = invoices.map(inv => [
      inv.invoice_number || '', inv.order_number || '', inv.back_order_number || '',
      inv.entity_name || '', inv.order_category || '',
      inv.invoice_date || '', inv.invoice_type || '', inv.po_number || '',
      inv.grand_total || '', inv.status || '',
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `invoices_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  }

  const handlePrint = () => {
    window.print()
  }

  const hasFilters = searchInv || searchOrder || searchEntity || dateFrom

  // Calculate summary stats
  const totalInvoices = invoices.length
  const draftCount = invoices.filter(i => i.status === 'DRAFT').length
  const confirmedCount = invoices.filter(i => i.status === 'CONFIRMED').length
  const cancelledCount = invoices.filter(i => i.status === 'CANCELLED').length
  const totalValue = invoices.reduce((s, i) => s + parseFloat(i.grand_total ?? 0), 0)

  const statCards = [
    { label: "Total Invoices", value: totalInvoices },
    { label: "Draft", value: draftCount },
    { label: "Confirmed", value: confirmedCount },
    { label: "Cancelled", value: cancelledCount, highlight: cancelledCount > 0 },
    { label: "Total Value", value: fmtAmt(totalValue) }
  ]

  return (
    <div style={{ fontFamily: FONT, background: '#f8fafc', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        
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
      `}</style>

      {/* BANNER */}
      <div style={{
        backgroundImage: `url(${banner})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        borderRadius: 16,
        padding: "28px 32px 110px",
        position: "relative",
        marginBottom: 72
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
              Sales Invoices
            </h1>
            <p style={{ color: "rgba(255,255,255,.8)", fontSize: 14, marginTop: 6 }}>
              All invoices — track status, amounts & confirmations
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
              <path d="M12 5v14M5 12h14" />
            </svg>
            New Invoice
          </button>
        </div>

        {/* STAT CARDS */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(5,1fr)",
          gap: 16,
          position: "absolute",
          bottom: -52,
          left: 32,
          right: 32
        }}>
          {statCards.map((s, i) => (
            <StatCard key={i} {...s} />
          ))}
        </div>
      </div>

      {/* MAIN TABLE CARD */}
      <div style={{
        background: "#fff",
        border: `1px solid ${BORDER}`,
        borderRadius: 14,
        padding: "24px 24px 20px",
        boxShadow: "0 1px 6px rgba(0,0,0,0.05)"
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

        {/* TOP BAR */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: 20
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: PRIMARY }}>
              Invoice List
            </h3>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn-outline" onClick={handlePrint}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d={ic.print} />
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

        {/* FILTERS ROW */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1.5fr 1.5fr 2fr 1.2fr auto auto",
          gap: 12,
          marginBottom: 16,
          alignItems: "end"
        }}>
          <div style={{ position: "relative" }}>
            <span className="filter-label">Invoice Number</span>
            <input
              className="filter-input"
              placeholder="e.g. INV-2024001"
              value={searchInv}
              onChange={e => setSearchInv(e.target.value)}
            />
          </div>
          <div style={{ position: "relative" }}>
            <span className="filter-label">Order Number</span>
            <input
              className="filter-input"
              placeholder="e.g. ORD-001"
              value={searchOrder}
              onChange={e => setSearchOrder(e.target.value)}
            />
          </div>
          <div style={{ position: "relative" }}>
            <span className="filter-label">Entity Name</span>
            <input
              className="filter-input"
              placeholder="Customer name..."
              value={searchEntity}
              onChange={e => setSearchEntity(e.target.value)}
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
          <button className="btn-primary" onClick={handleManualSearch}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            Search
          </button>
          <button className="btn-secondary" onClick={clearFilters}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="4" x2="20" y2="20" />
              <line x1="4" y1="20" x2="20" y2="4" />
            </svg>
            Clear
          </button>
        </div>

        {/* ACTIVE FILTERS */}
        {hasFilters && (
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {searchInv && (
              <span className="tag-chip">
                Invoice: {searchInv}
                <button onClick={() => setSearchInv('')}>×</button>
              </span>
            )}
            {searchOrder && (
              <span className="tag-chip">
                Order: {searchOrder}
                <button onClick={() => setSearchOrder('')}>×</button>
              </span>
            )}
            {searchEntity && (
              <span className="tag-chip">
                Entity: {searchEntity}
                <button onClick={() => setSearchEntity('')}>×</button>
              </span>
            )}
            {dateFrom && (
              <span className="tag-chip">
                From: {dateFrom}
                <button onClick={() => setDateFrom('')}>×</button>
              </span>
            )}
          </div>
        )}

        {/* RESULTS COUNT */}
        <div style={{ marginBottom: 12, fontSize: 13, color: "#64748b" }}>
          Showing {invoices.length} invoice{invoices.length !== 1 ? 's' : ''}
        </div>

        {/* TABLE */}
        <div style={{ overflowX: "auto", borderRadius: 10, border: `1px solid ${BORDER}` }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {['Invoice No.', 'Order No.', 'Back Order No.', 'Entity Name', 'Category',
                  'Invoice Date', 'PO Number', 'Invoice Type', 'Amount', 'Status'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <div style={{ width: 18, height: 18, border: `2px solid ${BORDER}`, borderTopColor: PRIMARY, borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
                      Loading…
                    </div>
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: 56, textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, color: '#94a3b8' }}>
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d={ic.invoice} />
                      </svg>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#64748b' }}>No invoices found</div>
                      <div style={{ fontSize: 13 }}>Create a dispatch first and generate an invoice from there.</div>
                    </div>
                  </td>
                </tr>
              ) : invoices.map((inv, idx) => (
                <tr
                  key={inv.id || idx}
                  className="row-hover"
                  onClick={() => navigate(`/${role}/logistics/invoices/${inv.id}`)}
                >
                  <td>
                    <span style={{ fontWeight: 700, color: PRIMARY, fontFamily: 'monospace', fontSize: 13 }}>
                      {inv.invoice_number || '(Draft)'}
                    </span>
                  </td>
                  <td style={{ color: '#64748b', fontFamily: 'monospace' }}>{inv.order_number || '—'}</td>
                  <td style={{ color: '#64748b', fontFamily: 'monospace', fontSize: 12 }}>{inv.back_order_number || '—'}</td>
                  <td style={{ fontWeight: 500, maxWidth: 180 }}>
                    <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {inv.entity_name || inv.bill_to?.entity_name || '—'}
                    </span>
                  </td>
                  <td><CategoryBadge category={inv.order_category} /></td>
                  <td style={{ color: '#374151' }}>{fmtDate(inv.invoice_date)}</td>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600, color: '#1e293b', fontSize: 12 }}>{inv.po_number || '—'}</td>
                  <td>
                    {inv.invoice_type ? (
                      <span style={{ background: '#f1f5f9', color: '#475569', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                        {INVOICE_TYPE_LABELS[inv.invoice_type] || inv.invoice_type}
                      </span>
                    ) : '—'}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: PRIMARY }}>
                    {inv.grand_total ? fmtAmt(inv.grand_total) : '—'}
                  </td>
                  <td><StatusBadge status={inv.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}