import { useEffect, useState } from "react";
import api from "../../api/axios";
import ManagerDashboardCharts from "./ManagerDashboardCharts";
import NewEnquiryModal from "../../components/modals/NewEnquiryModal";
import Toast from "../../components/Toast";
import dashboardBanner from "../../assets/dashboard-banner.png";
import "../../styles/dashboard.css";

function formatNum(n) {
  if (!n || n === 0) return "₹0";
  const absN = Math.abs(Number(n));
  if (absN >= 10000000) return `₹${(absN / 10000000).toFixed(2)} Cr`;
  if (absN >= 100000) return `₹${(absN / 100000).toFixed(2)} L`;
  return `₹${Number(n).toLocaleString("en-IN")}`;
}

function formatPercent(pct) {
  return `${Number(pct || 0).toFixed(1)}%`;
}

function getOrdinalDate() {
  const today = new Date();
  const d = String(today.getDate()).padStart(2, "0");
  const m = String(today.getMonth() + 1).padStart(2, "0");
  return `${d}/${m}/${today.getFullYear()}`;
}

export default function ManagerDashboard() {
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast]         = useState(null);
  const [enquiries, setEnquiries] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dashRes, enqRes] = await Promise.all([
        api.get("/dashboard/manager/"),
        api.get("/enquiries/?page_size=10"),
      ]);
      setData(dashRes.data);
      const enqList = Array.isArray(enqRes.data)
        ? enqRes.data
        : enqRes.data?.results || [];
      setEnquiries(enqList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const {
    summary_cards,
    sales_pipeline,
    mom_sales_target,
    leaderboard,
    revenue_by_product_line,
    sales_funnel,
    sales_metrics,
    date_range,
  } = data || {};

  // Logic to fix the "Empty Sales Reps" issue:
  // We check sales_pipeline first, then fallback to leaderboard names, then fallback to MoM target keys
  const repsList = sales_pipeline?.sales_reps || leaderboard || 
    (mom_sales_target?.sales_reps ? Object.keys(mom_sales_target.sales_reps).map(name => ({ name })) : []);

  const achievedTarget   = summary_cards?.achieved_target;
  const atRisk           = summary_cards?.at_risk_enquiries;
  const stalled          = summary_cards?.stalled_deals;
  const pendingFollowups = summary_cards?.pending_followups;

  const formatDateRange = () =>
    date_range ? `${date_range.start} – ${date_range.end}` : "This month";

  if (loading)
    return (
      <div className="dashboard-wrapper">
        <div className="dashboard-banner" style={{ backgroundImage: `url(${dashboardBanner})` }}>
          <div className="dashboard-title">Dashboard</div>
        </div>
        <div className="stats-row">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="stat-card skeleton" style={{ height: 110 }} />
          ))}
        </div>
      </div>
    );

  return (
    <div className="dashboard-wrapper" style={{ backgroundColor: "#F8FAFC", paddingBottom: "40px" }}>

      {/* ─── BANNER ─── */}
      <div
        className="dashboard-banner"
        style={{ 
          backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(${dashboardBanner})`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 40px',
          height: '180px',
          borderRadius: '16px'
        }}
      >
        <div>
          <div className="dashboard-title" style={{ fontSize: '32px', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>Manager Overview</div>
          <div style={{ color: 'white', opacity: 0.9, marginTop: 4 }}>{formatDateRange()}</div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            background: "#19364A",
            border: "2px solid rgba(255,255,255,0.8)",
            color: "white",
            padding: "12px 24px",
            borderRadius: 10,
            cursor: "pointer",
            fontWeight: 700,
            fontSize: 14,
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
          }}
        >
          + Create New Enquiry
        </button>
      </div>

      {/* ─── STAT CARDS ─── */}
      <div className="stats-row" style={{ marginTop: '-40px', position: 'relative', zIndex: 5 }}>
        {[
          { label: "Team Performance (INR)", value: formatNum(achievedTarget?.achieved), sub: `Target: ${formatNum(achievedTarget?.target)}` },
          { label: "At Risk Enquiries",              value: atRisk?.count ?? 0,                  sub: "Due within 7 days" },
          { label: "Stalled Deals",                  value: stalled?.count ?? 0,                 sub: "No activity in 14+ days" },
          { label: "Pending Follow-Ups",             value: pendingFollowups ?? 0,               sub: "Due today or overdue" },
        ].map((c, i) => (
          <div key={i} className="stat-card" style={{ border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
            <div className="stat-title" style={{ fontWeight: 600, color: '#64748B' }}>{c.label}</div>
            <div className="stat-value" style={{ color: '#0F172A', margin: '8px 0' }}>{c.value}</div>
            <div className="stat-sub" style={{ color: '#94A3B8' }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* ─── QUOTATIONS + SALES PIPELINE ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 26, marginTop: 40 }}>

        {/* Quotations Section */}
        <div style={{ background: 'white', padding: 24, borderRadius: 16, border: '1px solid #E2E8F0' }}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionTitle}>Recent Quotations ↗</span>
            <span style={styles.pill}>Today ({getOrdinalDate()}) ▾</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {enquiries.length > 0 ? enquiries.slice(0, 4).map((e, i) => (
              <div key={i} style={styles.enquiryCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#2563EB", letterSpacing: '0.5px' }}>{e.enquiry_number || "NO-ID"}</span>
                  <span style={{ fontSize: 11, background: '#EFF6FF', color: '#2563EB', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>{e.status || 'NEW'}</span>
                </div>

                <div style={styles.enquiryInfoRow}>
                  <span style={{ fontWeight: 700, color: "#1E293B" }}>{e.customer_detail?.company_name || "Unknown Client"}</span>
                  <span style={{ color: "#94A3B8" }}>•</span>
                  <span style={{ color: "#64748B", fontSize: 13 }}>{e.customer_detail?.city || "Unknown City"}</span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 8, fontSize: 13, marginTop: 12 }}>
                  <div style={{ color: "#64748B" }}>Rep: <span style={{ color: "#334155", fontWeight: 600 }}>{e.assigned_to_name || "Unassigned"}</span></div>
                  <div style={{ color: "#64748B", textAlign: 'right' }}>Value: <span style={{ color: "#0F172A", fontWeight: 700 }}>INR {formatNum(e.prospective_value)}</span></div>
                </div>
              </div>
            )) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#94A3B8' }}>No active enquiries.</div>
            )}
          </div>
        </div>

        {/* Sales Pipeline Section */}
        <div style={{ background: 'white', padding: 24, borderRadius: 16, border: '1px solid #E2E8F0' }}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionTitle}>Sales Pipeline ↗</span>
            <span style={styles.pill}>{formatDateRange()} ▾</span>
          </div>

          <div style={{
            background: "#0F172A",
            borderRadius: 14,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            overflow: "hidden",
            marginBottom: 24,
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ padding: "24px" }}>
              <div style={{ fontSize: 12, color: "#94A3B8", textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>Total Pipeline</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#FFFFFF" }}>{formatNum(sales_pipeline?.total_pipeline_value)}</div>
            </div>
            <div style={{ padding: "24px", background: "rgba(255,255,255,0.05)", borderLeft: "1px solid rgba(255,255,255,0.1)" }}>
              <div style={{ fontSize: 12, color: "#94A3B8", textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>Coverage Ratio</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#10B981" }}>{sales_pipeline?.coverage_ratio || 0}x</div>
            </div>
          </div>

          <div style={styles.sectionHeader}>
            <span style={{ fontSize: 16, fontWeight: 700 }}>Team Breakdown</span>
            <span style={{ color: "#64748B", fontSize: 12 }}>{repsList.length} Members</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
            {repsList.length > 0 ? repsList.map((rep, i) => (
              <div key={i} style={{
                background: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: 12,
                padding: "16px",
                display: 'flex',
                flexDirection: 'column',
                gap: 4
              }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1E293B" }}>{rep.name || rep.username}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <span style={{ fontSize: 13, color: "#64748B" }}>{formatNum(rep.achieved || 0)}</span>
                   <span style={{ fontSize: 12, fontWeight: 700, color: "#10B981" }}>{rep.coverage_ratio || 0}x</span>
                </div>
              </div>
            )) : (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 20, color: '#94A3B8' }}>No Sales Representatives found.</div>
            )}
          </div>
        </div>
      </div>

      {/* ─── CHARTS ─── */}
      <div style={{ marginTop: 32 }}>
        <ManagerDashboardCharts
          momSalesTarget={mom_sales_target}
          revenueByProduct={revenue_by_product_line}
          leaderboard={leaderboard}
          salesFunnel={sales_funnel}
          loading={loading}
          dateRange={formatDateRange()}
        />
      </div>

      {/* ─── SALES METRICS ─── */}
      <div style={{ marginTop: 32, background: 'white', padding: 30, borderRadius: 16, border: '1px solid #E2E8F0' }}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionTitle}>Key Sales Metrics</span>
          <span style={styles.pill}>{formatDateRange()} ▾</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>
          {[
            { label: "Avg Sales Cycle",            value: `${sales_metrics?.sales_cycle_days || 0} Days`, color: '#3B82F6' },
            { label: "Average Win Rate",          value: formatPercent(sales_metrics?.win_rate), color: '#10B981' },
            { label: "Repeat Business",   value: formatPercent(sales_metrics?.repeat_customer_ratio), color: '#8B5CF6' },
          ].map((m, i) => (
            <div key={i} style={{
              background: "#F8FAFC", borderRadius: 14,
              border: "1px solid #e5e7eb", padding: "28px",
              textAlign: "center", position: 'relative'
            }}>
              <div style={{ fontSize: 13, color: "#64748B", marginBottom: 12, fontWeight: 600, textTransform: 'uppercase' }}>{m.label}</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: m.color }}>{m.value}</div>
              <div style={{ fontSize: 12, color: "#64748B", marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <span style={{ color: '#10B981' }}>▲ 12%</span> vs last month
              </div>
            </div>
          ))}
        </div>
      </div>

      <NewEnquiryModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={(msg) => { setToast(msg); fetchData(); }}
      />
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

const styles = {
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 800,
    color: "#0F172A",
  },
  pill: {
    fontSize: 12,
    fontWeight: 600,
    color: "#475569",
    background: "#FFFFFF",
    border: "1px solid #CBD5E1",
    borderRadius: 6,
    padding: "6px 12px",
    cursor: "pointer",
  },
  enquiryCard: {
    background: "#FDFDFD",
    borderRadius: 12,
    border: "1px solid #E2E8F0",
    padding: "16px",
    transition: 'transform 0.2s ease',
    cursor: 'pointer'
  },
  enquiryInfoRow: {
    display: "flex", 
    alignItems: "center", 
    gap: 8,
    fontSize: 15, 
    color: "#334155",
    marginBottom: 4
  }
};