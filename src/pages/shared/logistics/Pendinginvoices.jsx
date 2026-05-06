// pages/shared/logistics/PendingInvoices.jsx
import { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../../api/axios'
import banner from '../../../assets/dashboard-banner.png'

const PRIMARY = "#122C41"
const BORDER = "#e2e8f0"
const FONT = "'Inter', 'Segoe UI', sans-serif"

const fmt = n => new Intl.NumberFormat("en-IN").format(n ?? 0)
const fmtAmt = n => `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n ?? 0)}`

// Status colors and labels
const INVOICE_STATUS = {
  NOT_INVOICED: { bg: "#fffbe6", color: "#c8860a", dot: "#f0a500", label: "Not Invoiced" },
  PARTIALLY_INVOICED: { bg: "#e6f0ff", color: "#1a7fd4", dot: "#1a7fd4", label: "Partial" },
  FULLY_INVOICED: { bg: "#e6fff5", color: "#0a9e6e", dot: "#0fc878", label: "Fully Invoiced" }
}

const STAT_ICONS = {
  "Ready to Dispatch": "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  "Dispatching Today": "M3 12h3l3-9 3 18 3-9h3",
  "Overdue / Breaching": "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  "Urgent Delivery": "M12 2a10 10 0 0110 10c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2zM12 6v6l3 3"
}

function StatusBadge({ status, type = "invoice" }) {
  if (type === "invoice") {
    const s = INVOICE_STATUS[status] || { bg: "#f1f5f9", color: "#475569", dot: "#94a3b8" }
    return (
      <span style={{
        background: s.bg,
        color: s.color,
        padding: "4px 12px",
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        whiteSpace: "nowrap"
      }}>
        <span style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: s.dot,
          display: "inline-block"
        }} />
        {s.label}
      </span>
    )
  }
  return null
}

function CategoryBadge({ category }) {
  const isDomestic = category === 'DOMESTIC'
  return (
    <span style={{
      background: isDomestic ? "#e8f5e9" : "#e3f2fd",
      color: isDomestic ? "#2e7d32" : "#1565c0",
      padding: "4px 12px",
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 600,
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      whiteSpace: "nowrap"
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

function StatCard({ label, value, trend, trendLabel, highlight }) {
  const iconPath = STAT_ICONS[label]
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
        <p style={{ margin: 0, fontSize: 13, color: "#64748b", fontWeight: 500, display: "flex", alignItems: "center", gap: 7 }}>
          {iconPath && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d={iconPath} />
            </svg>
          )}
          {label}
        </p>
      </div>
      <h2 style={{ margin: 0, fontSize: 32, fontWeight: 700, color: highlight ? "#dc2626" : PRIMARY, letterSpacing: "-0.5px" }}>
        {typeof value === "number" ? fmt(value) : value}
      </h2>
      {trendLabel && (
        <p style={{ margin: 0, fontSize: 12, color: trend === "up" ? "#16a34a" : "#dc2626", display: "flex", alignItems: "center", gap: 4 }}>
          <span>{trend === "up" ? "↑" : "↓"}</span>
          {trendLabel}
        </p>
      )}
    </div>
  )
}

const TABS = [
  { key: '', label: 'All' },
  { key: 'URGENT', label: 'Urgent Delivery Request' },
  { key: 'DOMESTIC', label: 'Domestic' },
  { key: 'INTERNATIONAL', label: 'Export' },
]

export default function PendingInvoices({ role = 'employee' }) {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('')
  const [stats, setStats] = useState({})
  const [statsLoading, setStatsLoading] = useState(true)

  // Filters
  const [searchPO, setSearchPO] = useState('')
  const [location, setLocation] = useState('')
  const [date, setDate] = useState('')

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      const params = {}
      if (activeTab && activeTab !== 'URGENT') params.category = activeTab
      if (searchPO) params.po_number = searchPO
      if (location) params.location = location
      if (date) params.date = date

      const res = await api.get('/logistics/invoices/pending/', { params })
      setOrders(res.data || [])
    } catch (err) {
      console.error('Error fetching pending invoices:', err)
    } finally {
      setLoading(false)
    }
  }, [activeTab, searchPO, location, date])

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true)
      const res = await api.get('/logistics/back-orders/stats/')
      setStats({
        ready_to_dispatch: res.data.ready_to_dispatch || 0,
        dispatching_today: res.data.dispatching_today || 0,
        overdue: res.data.overdue || 0,
        urgent: res.data.urgent || 0,
      })
    } catch (err) {
      console.error('Error fetching stats:', err)
    } finally {
      setStatsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
    fetchStats()
  }, [fetchOrders, fetchStats])

  // Debounced search
  const [debouncedPO, setDebouncedPO] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedPO(searchPO), 400)
    return () => clearTimeout(timer)
  }, [searchPO])
  useEffect(() => { fetchOrders() }, [debouncedPO])

  const handleExport = () => {
    const headers = ["PO Number", "Entity Name", "Order Type", "Order Number", "Net Amount", "Invoice Status", "Stage", "Location"]
    const rows = orders.map(o => [
      o.po_number || '', o.entity_name || '', o.order_category || '',
      o.order_number || '', o.net_amount || '', o.invoice_status || '',
      o.stage || '', o.location || ''
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `pending_invoices_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  }

  const handlePrint = () => {
    window.print()
  }

// Replace the existing handleRowClick in PendingInvoices.jsx with:

  const handleRowClick = (order) => {
    // Try different possible field names that might contain the order ID
    const orderId = order.order_id || order.id || order.order_number || order.pk
    
    // Log to debug what's available
    console.log("Order object keys:", Object.keys(order))
    console.log("Order ID candidates:", { order_id: order.order_id, id: order.id, order_number: order.order_number })
    console.log("Navigating to dispatch for orderId:", orderId)
    
    if (!orderId) {
      console.error("No order ID found in order object:", order)
      alert("Could not find order ID. Please check the console for details.")
      return
    }
    
    navigate(`/${role}/logistics/create-dispatch/${orderId}`)
  }

  // Also add a function to check for existing draft before showing confirmation
  const checkExistingDraft = async (order) => {
    try {
      const res = await api.get(`/logistics/invoices/?order=${order.order_id}&status=DRAFT`)
      if (res.data.results && res.data.results.length > 0) {
        return res.data.results[0]
      }
      return null
    } catch (err) {
      console.error('Error checking existing draft:', err)
      return null
    }
  }

  const clearFilters = () => {
    setSearchPO('')
    setLocation('')
    setDate('')
  }

  const filteredOrders = useMemo(() => {
    let filtered = [...orders]
    if (activeTab === 'URGENT') {
      filtered = filtered.filter(o => o.is_urgent === true)
    }
    return filtered
  }, [orders, activeTab])

  const statCards = [
    { label: "Ready to Dispatch", value: filteredOrders.length, trend: "up", trendLabel: "Increased since last month" },
    { label: "Dispatching Today", value: stats.dispatching_today || 0 },
    { label: "Overdue / Breaching", value: stats.overdue || 0, trend: "down", highlight: true },
    { label: "Urgent Delivery", value: stats.urgent || 0 }
  ]

  return (
    <div style={{ fontFamily: FONT, background: "#f8fafc", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
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
              New Invoice
            </h1>
          </div>
          <button
            onClick={() => navigate(`/${role}/logistics/invoices`)}
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
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6" />
            </svg>
            All Invoices
          </button>
        </div>

        {/* STAT CARDS */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
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
              Pending Invoice
            </h3>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn-outline" onClick={handlePrint}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

        {/* FILTERS ROW */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "2fr 1.5fr 1fr auto auto",
          gap: 12,
          marginBottom: 16,
          alignItems: "end"
        }}>
          <div style={{ position: "relative" }}>
            <span className="filter-label">Search PO Number</span>
            <input
              className="filter-input"
              placeholder="Enter PO Number"
              value={searchPO}
              onChange={e => setSearchPO(e.target.value)}
            />
          </div>
          <div style={{ position: "relative" }}>
            <span className="filter-label">Location</span>
            <input
              className="filter-input"
              placeholder="Enter Location"
              value={location}
              onChange={e => setLocation(e.target.value)}
            />
          </div>
          <div style={{ position: "relative" }}>
            <span className="filter-label">Date</span>
            <input
              type="date"
              className="filter-input"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>
          <button className="btn-primary" onClick={fetchOrders}>
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
        {(searchPO || location || date) && (
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {searchPO && (
              <span className="tag-chip">
                PO: {searchPO}
                <button onClick={() => setSearchPO("")}>×</button>
              </span>
            )}
            {location && (
              <span className="tag-chip">
                Location: {location}
                <button onClick={() => setLocation("")}>×</button>
              </span>
            )}
            {date && (
              <span className="tag-chip">
                Date: {date}
                <button onClick={() => setDate("")}>×</button>
              </span>
            )}
          </div>
        )}

        {/* RESULTS COUNT */}
        <div style={{ marginBottom: 12, fontSize: 13, color: "#64748b" }}>
          Showing {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''} pending invoicing
        </div>

        {/* TABLE */}
        <div style={{ overflowX: "auto", borderRadius: 10, border: `1px solid ${BORDER}` }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {["PO Number", "Entity Name", "Order Type", "Order Number", "Location", "Net Amount", "Invoice Status", "Action"].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>Loading...</td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>
                    {orders.length === 0 ? "No pending orders found" : "No orders match your filters"}
                  </td>
                </tr>
              ) : filteredOrders.map((order, idx) => (
                     <tr 
                        key={order.order_id || order.id || idx} 
                        className="row-hover" 
                        onClick={() => handleRowClick(order)}
                      >
                  <td style={{ fontWeight: 600, color: PRIMARY, fontFamily: "monospace" }}>{order.po_number || "—"}</td>
                  <td style={{ fontWeight: 500 }}>{order.entity_name || "—"}</td>
                  <td><CategoryBadge category={order.order_category} /></td>
                  <td style={{ color: "#64748b", fontFamily: "monospace" }}>{order.order_number}</td>
                  <td>{order.location || "—"}</td>
                  <td style={{ fontWeight: 600, color: PRIMARY }}>{order.net_amount ? fmtAmt(order.net_amount) : "—"}</td>
                  <td><StatusBadge status={order.invoice_status} type="invoice" /></td>
                 <td onClick={(e) => e.stopPropagation()}>
                  <button
                    className="btn-outline"
                    style={{ padding: "6px 14px", fontSize: 12 }}
                    onClick={(e) => {
                      e.stopPropagation()
                      // Use the same logic as handleRowClick
                      const orderId = order.order_id || order.id || order.order_number
                      console.log("Button clicked - orderId:", orderId)
                      if (orderId) {
                        navigate(`/${role}/logistics/create-dispatch/${orderId}`)
                      } else {
                        console.error("No order ID for button click:", order)
                        alert("Cannot create dispatch: Order ID missing")
                      }
                    }}
                  >
                    Create Dispatch
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>
                </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}