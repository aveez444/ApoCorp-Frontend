// pages/shared/logistics/OrderTracking.jsx
import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../../api/axios'
import banner from '../../../assets/dashboard-banner.png'

const PRIMARY = "#122C41"
const ACCENT = "#1a7fd4"
const BORDER = "#e2e8f0"
const FONT = "'Inter', 'Segoe UI', sans-serif"

const fmtDate = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const getDaysRemaining = (etdDate) => {
  if (!etdDate) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const etd = new Date(etdDate)
  etd.setHours(0, 0, 0, 0)
  const diffTime = etd - today
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

const STATUS_CONFIG = {
  PENDING:           { bg: "#fffbe6", color: "#c8860a", dot: "#f0a500", label: "Pending Dispatch" },
  INVOICED:          { bg: "#e6f0ff", color: "#1a7fd4", dot: "#1a7fd4", label: "Ready for Shipment" },
  IN_TRANSIT:        { bg: "#e6fff5", color: "#0a9e6e", dot: "#0fc878", label: "In Transit" },
  OUT_FOR_DELIVERY:  { bg: "#fff3e0", color: "#e65100", dot: "#ff6d00", label: "Out for Delivery" },
  DELIVERED:         { bg: "#e6fff5", color: "#0a9e6e", dot: "#0fc878", label: "Delivered" },
  DELAYED:           { bg: "#fef2f2", color: "#dc2626", dot: "#ef4444", label: "Delayed" },
  RETURNED:          { bg: "#fef2f2", color: "#dc2626", dot: "#ef4444", label: "Returned" },
  CANCELLED:         { bg: "#f1f5f9", color: "#64748b", dot: "#94a3b8", label: "Cancelled" },
  COMPLETED:         { bg: "#e6fff5", color: "#0a9e6e", dot: "#0fc878", label: "Completed" },
}

const STAT_ICONS = {
  "Orders Delivered":   "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
  "Orders In Progress": "M3 12h3l3-9 3 18 3-9h3",
  "Export Orders":      "M21 16v-2a4 4 0 00-4-4H5m0 0l3-3m-3 3l3 3M3 12h13a4 4 0 014 4v2",
  "Domestic Orders":    "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z",
}

function StatusBadge({ status }) {
  const s = STATUS_CONFIG[status] || { bg: "#f1f5f9", color: "#64748b", dot: "#94a3b8", label: status || "Unknown" }
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: s.bg, color: s.color,
      padding: "3px 10px", borderRadius: 20,
      fontSize: 11, fontWeight: 600, whiteSpace: "nowrap"
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
      {s.label}
    </span>
  )
}

function CategoryBadge({ category }) {
  const isDomestic = category === 'DOMESTIC'
  return (
    <span style={{
      background: isDomestic ? "#e8f5e9" : "#e3f2fd",
      color: isDomestic ? "#2e7d32" : "#1565c0",
      padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
      display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap"
    }}>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        {isDomestic
          ? <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          : <path d="M21 16v-2a4 4 0 00-4-4H5m0 0l3-3m-3 3l3 3M3 12h13a4 4 0 014 4v2" />}
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
      border: highlight ? "1.5px solid #fca5a5" : `1px solid ${BORDER}`,
      borderRadius: 12,
      padding: "20px 22px",
      display: "flex", flexDirection: "column", gap: 6,
      boxShadow: "0 1px 6px rgba(0,0,0,0.06)"
    }}>
      <p style={{ margin: 0, fontSize: 13, color: "#64748b", fontWeight: 500, display: "flex", alignItems: "center", gap: 7 }}>
        {iconPath && (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d={iconPath} />
          </svg>
        )}
        {label}
      </p>
      <h2 style={{ margin: 0, fontSize: 30, fontWeight: 700, color: highlight ? "#dc2626" : PRIMARY, letterSpacing: "-0.5px" }}>
        {typeof value === "number" ? new Intl.NumberFormat("en-IN").format(value) : value}
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

function TrackingCard({ backOrder, onClick }) {
  const [hovered, setHovered] = useState(false)
  const daysRemaining = getDaysRemaining(backOrder.etd)
  const etdText = daysRemaining !== null
    ? (daysRemaining > 0 ? `${daysRemaining} Days` : daysRemaining === 0 ? "Today" : "Overdue")
    : "—"
  const etdDate = backOrder.etd ? fmtDate(backOrder.etd) : "—"
  const isOverdue = daysRemaining !== null && daysRemaining < 0

  const invoice = backOrder.invoices?.[0] || {}
  const transporter = invoice.transporter || backOrder.transporter || "—"
  const modeOfTransport = invoice.mode_of_transport || backOrder.mode_of_transport || "—"
  const location = backOrder.location || backOrder.shipping_city || "—"
  const contactName = invoice.contact_name || backOrder.contact_name || "—"
  const contactNumber = invoice.contact_number || backOrder.contact_number || "—"
  const poNumber = backOrder.po_number || "—"
  const entityName = backOrder.entity_name || "—"

  return (
    <div
      onClick={() => onClick(backOrder)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#fff",
        border: `1px solid ${hovered ? "#c7d8ea" : BORDER}`,
        borderRadius: 14,
        overflow: "hidden",
        cursor: "pointer",
        transition: "all 0.2s ease",
        boxShadow: hovered ? "0 6px 20px rgba(18,44,65,0.10)" : "0 1px 4px rgba(0,0,0,0.05)",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Card Header — dark band */}
      <div style={{
        background: PRIMARY,
        padding: "12px 20px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        gap: 12, flexWrap: "wrap"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {/* PO icon */}
          <span style={{
            background: "rgba(255,255,255,0.12)",
            borderRadius: 8, padding: "5px 7px",
            display: "inline-flex", alignItems: "center"
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", letterSpacing: "0.2px" }}>
            PO : {poNumber}
          </span>
          <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 13 }}>|</span>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>
            {entityName}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <CategoryBadge category={backOrder.order_category} />
          <StatusBadge status={backOrder.status} />
          {backOrder.back_order_number && (
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontFamily: "monospace", marginLeft: 6 }}>
              #{backOrder.back_order_number}
            </span>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div style={{ padding: "16px 20px", flex: 1 }}>
        {/* Row 1: Transporter | Mode | Location */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
          gap: 0, marginBottom: 14,
          background: "#f8fafc", borderRadius: 10,
          border: `1px solid ${BORDER}`, overflow: "hidden"
        }}>
          {[
            { icon: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4", label: "Transporter", value: transporter },
            { icon: "M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10h10zm0 0h6a1 1 0 001-1v-3.586a1 1 0 00-.293-.707l-3.414-3.414A1 1 0 0015.586 7H13v9z", label: "Mode of Delivery", value: modeOfTransport },
            { icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z", label: "Location", value: location },
          ].map((item, idx) => (
            <div key={idx} style={{
              padding: "12px 16px",
              borderRight: idx < 2 ? `1px solid ${BORDER}` : "none",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={item.icon} />
                </svg>
                <span style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.6px", fontWeight: 600 }}>
                  {item.label}
                </span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* Row 2: Status | ETD | Contact | Arrow */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", flex: 1 }}>

            {/* Status pill inline */}
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.6px", fontWeight: 600 }}>Status</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: STATUS_CONFIG[backOrder.status]?.color || "#64748b" }}>
                {STATUS_CONFIG[backOrder.status]?.label || backOrder.status || "—"}
              </span>
            </div>

            <div style={{ width: 1, background: BORDER, alignSelf: "stretch" }} />

            {/* ETD */}
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.6px", fontWeight: 600 }}>ETD</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <span style={{
                  fontSize: 13, fontWeight: 700,
                  color: isOverdue ? "#dc2626" : etdText === "Today" ? "#d97706" : PRIMARY
                }}>
                  {etdText}
                </span>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>({etdDate})</span>
                {isOverdue && (
                  <span style={{
                    background: "#fef2f2", color: "#dc2626",
                    fontSize: 10, fontWeight: 700, padding: "2px 7px",
                    borderRadius: 20
                  }}>OVERDUE</span>
                )}
              </div>
            </div>

            <div style={{ width: 1, background: BORDER, alignSelf: "stretch" }} />

            {/* Contact */}
            <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 140 }}>
              <span style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.6px", fontWeight: 600 }}>Contact</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.22 1.18 2 2 0 012.18.01h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11l-1.27 1.27a16 16 0 006.29 6.29l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0121.99 16.92z" />
                </svg>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{contactName}</span>
                {contactNumber && contactNumber !== "—" && (
                  <span style={{ fontSize: 12, color: "#64748b" }}>{contactNumber}</span>
                )}
              </div>
            </div>
          </div>

          {/* Arrow CTA */}
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            color: ACCENT, fontSize: 12, fontWeight: 600,
            opacity: hovered ? 1 : 0.6,
            transition: "opacity 0.2s, transform 0.2s",
            transform: hovered ? "translateX(3px)" : "translateX(0)"
          }}>
            View Details
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}

const STATUS_FILTERS = [
  { key: "",               label: "All" },
  { key: "IN_TRANSIT",     label: "In Transit" },
  { key: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
  { key: "DELIVERED",      label: "Delivered" },
  { key: "DELAYED",        label: "Delayed" },
  { key: "PENDING",        label: "Pending" },
  { key: "INVOICED",       label: "Ready" },
]

export default function OrderTracking({ role = 'employee' }) {
  const navigate = useNavigate()
  const [backOrders, setBackOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [searchPO, setSearchPO] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [transporterFilter, setTransporterFilter] = useState("")

  const fetchTrackingList = useCallback(async () => {
    try {
      setLoading(true)
      const params = {}
      if (searchPO) params.po_number = searchPO
      if (statusFilter) params.tracking_status = statusFilter
      if (transporterFilter) params.transporter = transporterFilter
      const res = await api.get("/logistics/back-orders/tracking_list/", { params })
      setBackOrders(res.data || [])
    } catch (err) {
      console.error("Error fetching tracking list:", err)
    } finally {
      setLoading(false)
    }
  }, [searchPO, statusFilter, transporterFilter])

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get("/logistics/back-orders/stats/")
      setStats({
        orders_delivered: res.data.orders_delivered || 0,
        orders_in_progress: res.data.orders_in_progress || 0,
        export_orders: res.data.export_orders || 0,
        domestic_orders: res.data.domestic_orders || 0,
      })
    } catch (err) {
      console.error("Error fetching stats:", err)
    }
  }, [])

  useEffect(() => {
    fetchTrackingList()
    fetchStats()
  }, [fetchTrackingList, fetchStats])

  const debouncedSearch = useCallback(debounce(() => fetchTrackingList(), 400), [fetchTrackingList])
  useEffect(() => { debouncedSearch() }, [searchPO, statusFilter, transporterFilter, debouncedSearch])

  const handleCardClick = (backOrder) => navigate(`/${role}/logistics/order/${backOrder.id}`)
  const clearFilters = () => { setSearchPO(""); setStatusFilter(""); setTransporterFilter("") }

  const statCards = stats ? [
    { label: "Orders Delivered",   value: stats.orders_delivered,   trend: "up",   trendLabel: "Increased since last month" },
    { label: "Orders In Progress", value: stats.orders_in_progress, trend: "up",   trendLabel: "Increased since last month" },
    { label: "Export Orders",      value: stats.export_orders,      trend: "up",   trendLabel: "Increased since last month" },
    { label: "Domestic Orders",    value: stats.domestic_orders,    trend: "down",  trendLabel: "25% Increment since past month", highlight: false },
  ] : []

  return (
    <div style={{ fontFamily: FONT, background: "#f1f5f9", minHeight: "100vh", padding: "24px 32px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        .ot-filter-input {
          border: 1.5px solid ${BORDER};
          border-radius: 9px;
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
        .ot-filter-input:focus {
          border-color: ${PRIMARY};
          box-shadow: 0 0 0 3px rgba(18,44,65,0.08);
        }
        .ot-filter-input::placeholder { color: #b0bec5; }

        .ot-filter-label {
          position: absolute;
          top: -9px; left: 12px;
          background: #fff;
          padding: 0 4px;
          font-size: 11px;
          color: #64748b;
          font-weight: 500;
          pointer-events: none;
          z-index: 1;
        }

        .ot-btn-primary {
          background: ${PRIMARY};
          color: #fff;
          border: none;
          padding: 10px 22px;
          border-radius: 9px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          font-family: ${FONT};
          display: inline-flex;
          align-items: center;
          gap: 7px;
          transition: background 0.15s, transform 0.1s;
          white-space: nowrap;
        }
        .ot-btn-primary:hover { background: #1a3f5c; transform: translateY(-1px); }

        .ot-btn-secondary {
          background: #fff;
          color: #475569;
          border: 1.5px solid ${BORDER};
          padding: 10px 18px;
          border-radius: 9px;
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
        .ot-btn-secondary:hover { background: #f8fafc; border-color: #cbd5e1; }

        .ot-btn-outline {
          background: transparent;
          color: ${PRIMARY};
          border: 1.5px solid ${BORDER};
          padding: 9px 18px;
          border-radius: 9px;
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
        .ot-btn-outline:hover { background: #f1f5f9; border-color: #94a3b8; }

        .ot-tab-btn {
          background: transparent;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          font-family: ${FONT};
          color: #64748b;
          transition: all 0.15s;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
        }
        .ot-tab-btn:hover { background: #f1f5f9; color: ${PRIMARY}; }
        .ot-tab-btn.active {
          background: ${PRIMARY};
          color: #fff;
          font-weight: 600;
        }

        .ot-status-chip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: #f8fafc;
          color: #475569;
          border: 1.5px solid ${BORDER};
          border-radius: 20px;
          padding: 5px 14px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
          font-family: ${FONT};
        }
        .ot-status-chip.active {
          background: ${PRIMARY};
          color: #fff;
          border-color: ${PRIMARY};
          font-weight: 600;
        }
        .ot-status-chip:hover:not(.active) { background: #e8eef5; border-color: #b8ccd9; }

        @keyframes ot-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes ot-fadein {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        /* 2-Column Grid Layout */
        .ot-card-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          animation: ot-fadein 0.3s ease;
        }
        
        @media (max-width: 900px) {
          .ot-card-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* ── BANNER ── */}
      <div style={{
        backgroundImage: `url(${banner})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        borderRadius: 16,
        padding: "28px 32px 110px",
        position: "relative",
        marginBottom: 72,
      }}>
        {/* overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(120deg, rgba(18,44,65,.78), rgba(18,44,65,.42))",
          borderRadius: 16,
        }} />

        {/* Banner top row */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          position: "relative", zIndex: 2,
        }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, color: "rgba(255,255,255,.6)", marginBottom: 6, textTransform: "uppercase" }}>
              Outbound Logistics
            </p>
            <h1 style={{ color: "#fff", fontSize: 26, margin: 0, fontWeight: 700, letterSpacing: "-0.3px" }}>
              Order Tracking
            </h1>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              className="ot-btn-outline"
              onClick={() => window.print()}
              style={{ background: "rgba(255,255,255,0.12)", color: "#fff", borderColor: "rgba(255,255,255,0.3)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z" />
              </svg>
              Print
            </button>
            <button
              style={{
                background: "#fff", border: "none",
                padding: "10px 22px", borderRadius: 10,
                fontWeight: 700, fontSize: 14, cursor: "pointer",
                color: PRIMARY, fontFamily: FONT,
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                display: "flex", alignItems: "center", gap: 8
              }}
              onClick={() => {/* Export to Excel handler */}}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18M9 3v18" />
              </svg>
              Export to Excel
            </button>
          </div>
        </div>

        {/* STAT CARDS floating */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          position: "absolute",
          bottom: -52,
          left: 32,
          right: 32,
        }}>
          {statCards.length > 0 ? statCards.map((s, i) => (
            <StatCard key={i} {...s} />
          )) : [1, 2, 3, 4].map(i => (
            <div key={i} style={{
              background: "#fff", border: `1px solid ${BORDER}`,
              borderRadius: 12, padding: "20px 22px", height: 90,
              boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
              background: "linear-gradient(90deg, #f1f5f9 25%, #e8eef4 50%, #f1f5f9 75%)",
              backgroundSize: "200% 100%",
              animation: "ot-shimmer 1.5s infinite"
            }} />
          ))}
        </div>
      </div>

      {/* ── MAIN TABLE CARD ── */}
      <div style={{
        background: "#fff",
        border: `1px solid ${BORDER}`,
        borderRadius: 16,
        padding: "24px 28px 28px",
        boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
      }}>

        {/* TABS row */}
        <div style={{
          display: "flex", gap: 4, marginBottom: 20, flexWrap: "wrap",
          borderBottom: `1px solid ${BORDER}`, paddingBottom: 14,
          justifyContent: "space-between", alignItems: "center"
        }}>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {[
              { key: "", label: "All", icon: "M4 6h16M4 12h16M4 18h7" },
              { key: "DOMESTIC", label: "Domestic", icon: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" },
              { key: "EXPORT", label: "Export", icon: "M21 16v-2a4 4 0 00-4-4H5m0 0l3-3m-3 3l3 3" },
            ].map(tab => (
              <button
                key={tab.key}
                className="ot-tab-btn"
                onClick={() => {/* category tab handler */}}
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d={tab.icon} />
                </svg>
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ fontSize: 13, color: "#94a3b8" }}>
            Showing <strong style={{ color: PRIMARY }}>{backOrders.length}</strong> shipment{backOrders.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* FILTER ROW */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "2fr 1.5fr 1.5fr auto auto",
          gap: 12, alignItems: "end", marginBottom: 16
        }}>
          <div style={{ position: "relative" }}>
            <span className="ot-filter-label">Search PO Number</span>
            <input className="ot-filter-input" placeholder="Enter PO Number" value={searchPO} onChange={e => setSearchPO(e.target.value)} />
          </div>
          <div style={{ position: "relative" }}>
            <span className="ot-filter-label">Status</span>
            <select
              className="ot-filter-input"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{ appearance: "auto", cursor: "pointer" }}
            >
              <option value="">All Status</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
              <option value="DELIVERED">Delivered</option>
              <option value="DELAYED">Delayed</option>
              <option value="PENDING">Pending Dispatch</option>
              <option value="INVOICED">Ready for Shipment</option>
            </select>
          </div>
          <div style={{ position: "relative" }}>
            <span className="ot-filter-label">Transporter</span>
            <input className="ot-filter-input" placeholder="Enter Transporter" value={transporterFilter} onChange={e => setTransporterFilter(e.target.value)} />
          </div>
          <button className="ot-btn-primary" onClick={fetchTrackingList}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            Search
          </button>
          <button className="ot-btn-secondary" onClick={clearFilters}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="4" x2="20" y2="20" /><line x1="4" y1="20" x2="20" y2="4" />
            </svg>
            Clear
          </button>
        </div>

        {/* QUICK STATUS CHIPS */}
        <div style={{ display: "flex", gap: 8, marginBottom: 22, flexWrap: "wrap" }}>
          {STATUS_FILTERS.map(filter => (
            <button
              key={filter.key}
              className={`ot-status-chip ${statusFilter === filter.key ? "active" : ""}`}
              onClick={() => setStatusFilter(filter.key)}
            >
              {filter.key && (
                <span style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: statusFilter === filter.key
                    ? "rgba(255,255,255,0.7)"
                    : STATUS_CONFIG[filter.key]?.dot || "#94a3b8",
                  display: "inline-block"
                }} />
              )}
              {filter.label}
            </button>
          ))}
        </div>

        {/* ACTIVE FILTER CHIPS */}
        {(searchPO || transporterFilter) && (
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {searchPO && (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: "#e8f0f7", color: PRIMARY,
                padding: "4px 12px", borderRadius: 20,
                fontSize: 12, fontWeight: 500
              }}>
                PO: {searchPO}
                <button
                  onClick={() => setSearchPO("")}
                  style={{ background: "none", border: "none", cursor: "pointer", color: PRIMARY, padding: 0, lineHeight: 1, fontSize: 14 }}
                >×</button>
              </span>
            )}
            {transporterFilter && (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: "#e8f0f7", color: PRIMARY,
                padding: "4px 12px", borderRadius: 20,
                fontSize: 12, fontWeight: 500
              }}>
                Transporter: {transporterFilter}
                <button
                  onClick={() => setTransporterFilter("")}
                  style={{ background: "none", border: "none", cursor: "pointer", color: PRIMARY, padding: 0, lineHeight: 1, fontSize: 14 }}
                >×</button>
              </span>
            )}
          </div>
        )}

        {/* CARD LIST - 2 COLUMN GRID */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>
            <div style={{
              width: 28, height: 28,
              border: `3px solid ${BORDER}`,
              borderTopColor: PRIMARY,
              borderRadius: "50%",
              animation: "ot-spin 0.8s linear infinite",
              margin: "0 auto 14px"
            }} />
            <p style={{ margin: 0, fontSize: 14 }}>Loading shipments...</p>
          </div>
        ) : backOrders.length === 0 ? (
          <div style={{
            background: "#f8fafc", border: `1px dashed ${BORDER}`,
            borderRadius: 14, padding: 56,
            textAlign: "center", color: "#94a3b8"
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" style={{ marginBottom: 14, opacity: 0.4 }}>
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M8 3v18M16 3v18M3 8h18M3 16h18" />
            </svg>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#64748b" }}>No shipments found</p>
            <p style={{ margin: "6px 0 0", fontSize: 13 }}>Try adjusting your filters or check back later</p>
          </div>
        ) : (
          <div className="ot-card-grid">
            {backOrders.map(bo => (
              <TrackingCard key={bo.id} backOrder={bo} onClick={handleCardClick} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => { clearTimeout(timeout); func(...args) }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}