import { useEffect, useState, useCallback, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import api from "../../api/axios"
import NewEnquiryModal from "../../components/modals/NewEnquiryModal"
import Toast from "../../components/Toast"
import banner from "../../assets/dashboard-banner.png"
import { printEnquiryReport } from "../../components/PrintEnquiryReport"
import { exportToPDF } from "../../components/ExportToPDF"

const PRIMARY = "#122C41"
const BORDER = "#e2e8f0"
const FONT = "'Inter', 'Segoe UI', sans-serif"

const fmt = n => new Intl.NumberFormat("en-IN").format(n ?? 0)

const STATUS_COLORS = {
  NEW:         { bg: "#e8f4ff", color: "#1a7fd4", dot: "#1a7fd4", border: "#a8d4f5" },
  PENDING:     { bg: "#fffbe6", color: "#c8860a", dot: "#f0a500", border: "#f5d98a" },
  NEGOTIATION: { bg: "#fdf0ff", color: "#9b30c8", dot: "#b84fe0", border: "#dfa8f5" },
  QUOTED:      { bg: "#e6fff5", color: "#0a9e6e", dot: "#0fc878", border: "#80e8c0" },
  PO_RECEIVED: { bg: "#e6faf0", color: "#0a8c5a", dot: "#12b76a", border: "#6edcaa" },
  LOST:        { bg: "#fff0f0", color: "#d12b2b", dot: "#f04040", border: "#f5a8a8" },
  REGRET:      { bg: "#f5f0ff", color: "#7e22ce", dot: "#a855f7", border: "#d4b0f5" }
}

const STATUS_LABELS = {
  NEW:         "New Enquiry",
  PENDING:     "Pending Enquiry",
  NEGOTIATION: "Under Negotiation",
  QUOTED:      "Quoted Enquiry",
  PO_RECEIVED: "PO Received",
  LOST:        "Enquiry Lost",
  REGRET:      "Regret"
}

// Status options for filter dropdown
const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "NEW", label: "New Enquiry" },
  { value: "NEGOTIATION", label: "Under Negotiation" },
  { value: "PO_RECEIVED", label: "PO Received" },
  { value: "LOST", label: "Enquiry Lost" },
  { value: "REGRET", label: "Regret" }
]

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || { bg: "#f1f5f9", color: "#475569", dot: "#94a3b8", border: "#e2e8f0" }
  return (
    <span style={{
      background: s.bg,
      color: s.color,
      border: `1px solid ${s.border}`,
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
        display: "inline-block",
        flexShrink: 0
      }} />
      {STATUS_LABELS[status] || status}
    </span>
  )
}

const STAT_ICONS = {
  "Pending Enquiry":     "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  "Quoted Enquiry":      "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  "Under Negotiation":   "M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3",
  "Enquiry Lost":        "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
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

export default function Enquiries({ basePath = "/employee/enquiries" }) {
  const navigate = useNavigate()
  const [enquiries, setEnquiries] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [location, setLocation] = useState("")
  const [date, setDate] = useState("")
  const [status, setStatus] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [toast, setToast] = useState(null)

  const fetchData = useCallback(() => {
    setLoading(true)
    Promise.all([api.get("/enquiries/"), api.get("/enquiries/stats/")])
      .then(([enqRes, statsRes]) => {
        setEnquiries(enqRes.data?.results || enqRes.data || [])
        setStats(statsRes.data || {})
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Filtered enquiries based on search inputs and status
  const filteredEnquiries = useMemo(() => {
    const filtered = enquiries.filter(enquiry => {
      const searchTerm = search.toLowerCase().trim()
      const matchesSearch = searchTerm === "" || 
        (enquiry.enquiry_number && enquiry.enquiry_number.toLowerCase().includes(searchTerm)) ||
        (enquiry.customer_detail?.company_name && enquiry.customer_detail.company_name.toLowerCase().includes(searchTerm)) ||
        (enquiry.customer_detail?.telephone_primary && enquiry.customer_detail.telephone_primary.includes(searchTerm)) ||
        (enquiry.enquiry_type && enquiry.enquiry_type.toLowerCase().includes(searchTerm))

      const locationTerm = location.toLowerCase().trim()
      const enquiryLocation = [
        enquiry.customer_detail?.city, 
        enquiry.customer_detail?.country
      ].filter(Boolean).join(", ").toLowerCase()
      const matchesLocation = locationTerm === "" || enquiryLocation.includes(locationTerm)

      const matchesDate = date === "" || enquiry.enquiry_date === date
      
      const matchesStatus = status === "" || enquiry.status === status

      return matchesSearch && matchesLocation && matchesDate && matchesStatus
    })

    return filtered.sort((a, b) => {
      if (!a.created_at && !b.created_at) return 0
      if (!a.created_at) return 1
      if (!b.created_at) return -1
      return new Date(b.created_at) - new Date(a.created_at)
    })
  }, [enquiries, search, location, date, status])

  // Preview first 8 filtered enquiries
  const preview = useMemo(() => {
    return filteredEnquiries.slice(0, 8)
  }, [filteredEnquiries])

  // Clear all filters
  const clearFilters = () => {
    setSearch("")
    setLocation("")
    setDate("")
    setStatus("")
  }

    // Simplified print handler
  const handlePrint = () => {
    printEnquiryReport(filteredEnquiries, stats)
  }

    // Optional: PDF download handler
  const handlePDFDownload = () => {
    exportToPDF(filteredEnquiries, stats)
  }


  const statCards = [
    { label: "Pending Enquiry",   value: stats.pending || 0,            trend: "up",   trendLabel: "5% Increment since past week" },
    { label: "Quoted Enquiry",    value: stats.quoted || 0 },
    { label: "Under Negotiation", value: stats.under_negotiation || 0 },
    { label: "Enquiry Lost",      value: stats.lost || 0,               trend: "down", trendLabel: "Dropped by 5.34% since last month", highlight: true }
  ]

  const handleExport = () => {
    const headers = ["Enquiry Number","Date","Target Date","Entity Name","Prospective Value","Phone","Enq Type","Location","Status"]
    const rows = filteredEnquiries.map(e => [
      e.enquiry_number, e.enquiry_date, e.target_submission_date,
      e.customer_detail?.company_name || "", e.prospective_value || "",
      e.customer_detail?.telephone_primary || "", e.enquiry_type || "",
      [e.customer_detail?.city, e.customer_detail?.country].filter(Boolean).join(", "),
      STATUS_LABELS[e.status] || e.status
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n")
    const a = document.createElement("a")
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }))
    a.download = `enquiries_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <div style={{ fontFamily: FONT, background: "#f8fafc", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        .row-hover { transition: background 0.15s; }
        .row-hover:hover { background: #f8fafc; cursor: pointer; }
        .row-hover:hover td { border-color: #e2e8f0; }

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
        
        .status-select {
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
          cursor: pointer;
          box-sizing: border-box;
        }
        .status-select:focus {
          border-color: #122C41;
          box-shadow: 0 0 0 3px rgba(18,44,65,0.08);
        }
      `}</style>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

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
          <h1 style={{ color: "#fff", fontSize: 26, margin: 0, fontWeight: 700, letterSpacing: "-0.3px" }}>
            Enquires ({fmt(filteredEnquiries.length)})
          </h1>
          <button
            onClick={() => setModalOpen(true)}
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
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
            }}
          >
            + New Enquiry
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

        {/* TOP BAR */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: 20
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: PRIMARY }}>
              Enquiry Stats
            </h3>
            <button
              onClick={() => navigate("/employee/enquiries/list")}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 4,
                display: "flex",
                alignItems: "center"
              }}
              title="View All Enquiries"
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
            <button className="btn-outline" onClick={handlePrint}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z" />
              </svg>
              Print / PDF
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
          gridTemplateColumns: "2fr 1.5fr 1fr 1fr auto auto",
          gap: 12,
          marginBottom: 16,
          alignItems: "end"
        }}>
          <div style={{ position: "relative" }}>
            <span className="filter-label">Search Enquiry</span>
            <input
              className="filter-input"
              placeholder="Search by number, company, phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
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
          <div style={{ position: "relative" }}>
            <span className="filter-label">Status</span>
            <select
              className="status-select"
              value={status}
              onChange={e => setStatus(e.target.value)}
            >
              {STATUS_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <button 
            className="btn-primary"
            onClick={() => {}} // Filters are applied automatically via useMemo
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
        {(search || location || date || status) && (
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {search && (
              <span className="tag-chip">
                Search: {search}
                <button onClick={() => setSearch("")}>×</button>
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
            {status && (
              <span className="tag-chip">
                Status: {STATUS_LABELS[status]}
                <button onClick={() => setStatus("")}>×</button>
              </span>
            )}
          </div>
        )}

        {/* Results count */}
        <div style={{ marginBottom: 12, fontSize: 13, color: "#64748b" }}>
          Showing {preview.length} of {filteredEnquiries.length} enquiries
          {filteredEnquiries.length !== enquiries.length && ` (filtered from ${enquiries.length} total)`}
        </div>

        {/* TABLE */}
        <div style={{ overflowX: "auto", borderRadius: 10, border: `1px solid ${BORDER}` }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {["Enquiry Number","Date","Target Date Submission","Entity Name","Prospective Value","Phone (Mobile)","Enq. Type","Location","Status"]
                  .map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>Loading...</td>
                </tr>
              ) : preview.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>
                    {enquiries.length === 0 ? "No enquiries found" : "No enquiries match your filters"}
                  </td>
                </tr>
              ) : preview.map(e => (
                <tr key={e.id} className="row-hover" onClick={() => navigate(`${basePath}/${e.id}`)}>
                  <td style={{ fontWeight: 600, color: PRIMARY }}>{e.enquiry_number}</td>
                  <td>{e.enquiry_date}</td>
                  <td>{e.target_submission_date}</td>
                  <td>{e.customer_detail?.company_name}</td>
                  <td style={{ fontWeight: 500 }}>{fmt(e.prospective_value)}</td>
                  <td>{e.customer_detail?.telephone_primary}</td>
                  <td>{e.enquiry_type}</td>
                  <td>{[e.customer_detail?.city, e.customer_detail?.country].filter(Boolean).join(", ")}</td>
                  <td><StatusBadge status={e.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {modalOpen && (
        <NewEnquiryModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={(msg) => {
            setModalOpen(false)
            setToast(msg || "Enquiry created")
            fetchData()
          }}
        />
      )}
    </div>
  )
}