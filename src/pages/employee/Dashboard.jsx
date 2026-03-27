import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import DashboardCharts from "./DashboardCharts";
import banner from "../../assets/dashboard-banner.png";
import "../../styles/dashboard.css";

// Helper for Indian Currency Formatting
function formatNum(n) {
  if (!n || n === 0) return "₹0";
  const absN = Math.abs(Number(n));
  if (absN >= 10000000) return `₹${(absN / 10000000).toFixed(2)} Cr`;
  if (absN >= 100000) return `₹${(absN / 100000).toFixed(2)} L`;
  return `₹${Number(n).toLocaleString("en-IN")}`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = () => {
    setLoading(true);
    api.get("/dashboard/")
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  function getStatusClass(status) {
    if (!status) return "";
    const s = status.toUpperCase();
    if (s.includes("NEW")) return "status-new";
    if (s.includes("PENDING")) return "status-pending";
    if (s.includes("PO")) return "status-po";
    if (s.includes("QUOTE")) return "status-quoted";
    if (s.includes("NEGOT")) return "status-negotiation";
    if (s.includes("LOST")) return "status-lost";
    return "";
  }

  return (
    <div className="dashboard-wrapper">
      {/* ─── BANNER ─── */}
      <div className="dashboard-banner" style={{ backgroundImage: `url(${banner})`, borderRadius: '14px' }}>
        <div className="dashboard-title">Performance Dashboard</div>
        <button
          onClick={() => navigate("/employee/enquiries")}
          style={styles.primaryBtn}
        >
          + New Enquiry
        </button>
      </div>

      {/* ─── STAT CARDS ─── */}
      <div className="stats-row">
        {loading
          ? [...Array(4)].map((_, i) => (
              <div key={i} className="stat-card skeleton" style={{ height: 115 }} />
            ))
          : data?.summary_cards &&
            Object.entries(data.summary_cards).slice(0, 4).map(([key, value], i) => (
              <div key={i} className="stat-card" style={styles.statCardCustom}>
                <div className="stat-title" style={styles.statTitleCustom}>
                  {key.replaceAll("_", " ")}
                </div>
                <div className="stat-value" style={styles.statValueCustom}>
                  {typeof value === "number" && key.toLowerCase().includes('value') ? formatNum(value) : value}
                </div>
              </div>
            ))}
      </div>

      {/* ─── MIDDLE SECTION ─── */}
      <div style={styles.middleGrid}>
        
        {/* Recent Enquiries Table */}
        <div className="table-card" style={styles.cardWrapper}>
          <div style={styles.cardHeader}>
            <span style={styles.cardHeaderText}>Recent Enquiries</span>
            <button onClick={() => navigate("/employee/enquiries")} style={styles.viewAllBtn}>View All ↗</button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: 'collapse' }}>
              <thead className="table-header">
                <tr>
                  <th style={styles.th}>Enquiry No.</th>
                  <th style={styles.th}>Customer</th>
                  <th style={styles.th}>City</th>
                  <th style={styles.th}>Due Date</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {data?.recent_enquiries?.length > 0 ? (
                  data.recent_enquiries.map((e, i) => (
                    <tr key={i} style={styles.tr}>
                      <td style={{ fontWeight: 600, color: '#2563EB' }}>{e.enquiry_number || "—"}</td>
                      <td>{e.customer_name || "—"}</td>
                      <td>{e.city || "—"}</td>
                      <td>
                        {e.due_date ? (
                          <span style={{ color: e.days_remaining <= 2 ? "#DC2626" : "#4B5563", fontWeight: e.days_remaining <= 2 ? 700 : 500 }}>
                            {e.due_date} {e.days_remaining ? `(${e.days_remaining}d)` : ""}
                          </span>
                        ) : "—"}
                      </td>
                      <td>
                        <span className={`status-badge ${getStatusClass(e.status)}`}>
                          {e.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="5" style={styles.emptyText}>No recent enquiries found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quote Expiry Alerts */}
        <div style={styles.cardWrapper}>
          <div style={styles.cardHeader}>
            <span style={styles.cardHeaderText}>Quote Expiry Alerts</span>
          </div>
          <div style={styles.quoteListWrapper}>
            {data?.expiring_quotations?.length > 0 ? (
              data.expiring_quotations.map((q, i) => {
                const color = q.days_remaining <= 2 ? "#EF4444" : q.days_remaining <= 7 ? "#EAB308" : "#3B82F6";
                return (
                  <div key={i} className="quote-card" style={{ ...styles.quoteCardCustom, borderLeft: `5px solid ${color}` }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px' }}>{q.quotation_number}</div>
                      <div style={{ color: "#6B7280", fontSize: '13px' }}>{q.customer_name}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ background: color + "15", color, padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                        Expires in {q.days_remaining}d
                      </div>
                      <div style={{ fontWeight: 700, marginTop: 6, fontSize: '15px' }}>{formatNum(q.grand_total)}</div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={styles.emptyStateContainer}>
                <div style={{ fontSize: '40px', marginBottom: '10px' }}>📄</div>
                <div style={{ fontWeight: 600, color: '#64748B' }}>No quotes expiring soon</div>
                <div style={{ fontSize: '12px', color: '#94A3B8' }}>Everything looks up to date!</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── CHARTS ─── */}
      <div style={{ marginTop: "28px" }}>
        <DashboardCharts
          momSales={data?.monthly_revenue || []}
          revenueByProduct={data?.product_wise_revenue || []}
          loading={loading}
        />
      </div>
    </div>
  );
}

const styles = {
  primaryBtn: {
    background: "#19364A",
    border: "1px solid rgba(255,255,255,0.3)",
    color: "white",
    padding: "10px 22px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "14px",
    transition: "all 0.2s"
  },
  statCardCustom: {
    background: "#fff",
    border: "1px solid #E2E8F0",
    borderRadius: "14px",
    padding: "20px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
  },
  statTitleCustom: {
    fontSize: "12px",
    fontWeight: 700,
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: "8px"
  },
  statValueCustom: {
    fontSize: "26px",
    fontWeight: 800,
    color: "#1E293B"
  },
  middleGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 400px",
    gap: "26px",
    marginTop: "28px"
  },
  cardWrapper: {
    background: "#fff",
    border: "1px solid #E2E8F0",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
    display: "flex",
    flexDirection: "column"
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "18px",
    paddingBottom: "12px",
    borderBottom: "1px solid #F1F5F9"
  },
  cardHeaderText: {
    fontSize: "18px",
    fontWeight: 700,
    color: "#1E293B"
  },
  viewAllBtn: {
    background: "none",
    border: "none",
    color: "#2563EB",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: "13px"
  },
  th: {
    textAlign: "left",
    padding: "12px 8px",
    color: "#64748B",
    fontSize: "13px",
    fontWeight: 600,
    background: "#F8FAFC"
  },
  tr: {
    borderBottom: "1px solid #F1F5F9"
  },
  quoteListWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    maxHeight: "450px",
    overflow: "auto"
  },
  quoteCardCustom: {
    background: "#F8FAFC",
    border: "1px solid #E2E8F0",
    borderRadius: "12px",
    padding: "14px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  emptyStateContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
    textAlign: "center"
  },
  emptyText: {
    textAlign: "center",
    padding: "30px",
    color: "#94A3B8",
    fontSize: "14px"
  }
};