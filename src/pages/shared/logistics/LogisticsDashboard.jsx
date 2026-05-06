// pages/shared/logistics/LogisticsDashboard.jsx

import { useEffect, useState } from "react";
import api from "../../../api/axios";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import dashboardBanner from "../../../assets/dashboard-banner.png";
import "../../../styles/dashboard.css";

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

function formatNum(n) {
  if (!n || n === 0) return "₹0";
  const absN = Math.abs(Number(n));
  if (absN >= 10000000) return `₹${(absN / 10000000).toFixed(2)} Cr`;
  if (absN >= 100000) return `₹${(absN / 100000).toFixed(2)} L`;
  return `₹${Number(n).toLocaleString("en-IN")}`;
}

function formatQuantity(qty) {
  if (!qty || qty === 0) return "0";
  return Number(qty).toLocaleString("en-IN");
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

function getStatusColor(status) {
  const colors = {
    PENDING: "#F59E0B",
    INVOICED: "#3B82F6",
    IN_TRANSIT: "#8B5CF6",
    OUT_FOR_DELIVERY: "#06B6D4",
    DELIVERED: "#10B981",
    DELAYED: "#EF4444",
    RETURNED: "#6B7280",
    CANCELLED: "#6B7280",
    COMPLETED: "#059669",
  };
  return colors[status] || "#64748B";
}

function getStatusBgColor(status) {
  const colors = {
    PENDING: "#FEF3C7",
    INVOICED: "#EFF6FF",
    IN_TRANSIT: "#F3E8FF",
    OUT_FOR_DELIVERY: "#CFFAFE",
    DELIVERED: "#D1FAE5",
    DELAYED: "#FEE2E2",
    RETURNED: "#F3F4F6",
    CANCELLED: "#F3F4F6",
    COMPLETED: "#D1FAE5",
  };
  return colors[status] || "#F1F5F9";
}

// Chart Colors
const LINE_COLORS = ["#2563EB", "#7C3AED", "#10B981", "#F59E0B", "#EF4444"];
const PIE_COLORS = ["#1E3A8A", "#2563EB", "#3B82F6", "#60A5FA", "#93C5FD", "#BFDBFE"];

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function StatCard({ label, value, subtext, trend, trendUp, color }) {
  return (
    <div className="stat-card" style={{ border: "1px solid #E2E8F0", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
      <div className="stat-title" style={{ fontWeight: 600, color: "#64748B" }}>{label}</div>
      <div className="stat-value" style={{ color: color || "#0F172A", margin: "8px 0", fontSize: "32px", fontWeight: 800 }}>
        {value}
      </div>
      <div className="stat-sub" style={{ color: "#94A3B8", display: "flex", alignItems: "center", gap: 6 }}>
        {trend !== undefined && trend !== null && (
          <span style={{ color: trendUp ? "#10B981" : "#EF4444", fontWeight: 600 }}>
            {trendUp ? "▲" : "▼"} {Math.abs(trend)}%
          </span>
        )}
        {subtext}
      </div>
    </div>
  );
}

function StatusDonutChart({ data }) {
  if (!data || data.length === 0) {
    return <div style={{ textAlign: "center", color: "#94A3B8", padding: "40px" }}>No data available</div>;
  }

  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 30 }}>
      <div style={{ position: "relative" }}>
        <PieChart width={180} height={180}>
          <Pie
            data={data}
            cx={90}
            cy={90}
            innerRadius={55}
            outerRadius={80}
            paddingAngle={3}
            dataKey="count"
            strokeWidth={0}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />
            ))}
          </Pie>
        </PieChart>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#0F172A" }}>{total}</div>
          <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600 }}>Total</div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {data.slice(0, 5).map((entry, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: getStatusColor(entry.status) }} />
            <span style={{ color: "#475569", fontWeight: 500, minWidth: 80 }}>{entry.status}</span>
            <span style={{ fontWeight: 700, color: "#1E293B" }}>{entry.count}</span>
            <span style={{ color: "#94A3B8", fontSize: 11 }}>({Math.round((entry.count / total) * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function WeeklyTrendChart({ data }) {
  if (!data || data.length === 0) {
    return <div style={{ textAlign: "center", color: "#94A3B8", padding: "40px" }}>No dispatch data available</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="dispatchGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
        <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#64748B", fontWeight: 500 }} axisLine={false} tickLine={false} dy={10} />
        <YAxis tickFormatter={(v) => formatQuantity(v)} tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} width={45} />
        <Tooltip
          formatter={(value) => [formatQuantity(value), "Units Dispatched"]}
          labelFormatter={(label, payload) => {
            if (payload && payload[0] && payload[0].payload) {
              return `${payload[0].payload.day} (${payload[0].payload.date})`;
            }
            return label;
          }}
          contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", fontSize: 12 }}
        />
        <Area type="monotone" dataKey="quantity" stroke="#2563EB" strokeWidth={3} fill="url(#dispatchGradient)" dot={{ r: 4, fill: "#2563EB", strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function CategoryBarChart({ data }) {
  if (!data) return null;

  const chartData = [
    { name: "Domestic", count: data.domestic?.count || 0, quantity: data.domestic?.quantity || 0 },
    { name: "International", count: data.international?.count || 0, quantity: data.international?.quantity || 0 },
  ];

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={true} vertical={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: "#64748B" }} tickFormatter={(v) => formatQuantity(v)} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 13, fontWeight: 600, fill: "#334155" }} width={100} />
        <Tooltip formatter={(value) => formatQuantity(value)} contentStyle={{ borderRadius: 12, border: "none", borderRadius: 8 }} />
        <Legend iconType="circle" />
        <Bar dataKey="quantity" name="Quantity (units)" fill="#3B82F6" radius={[0, 8, 8, 0]} />
        <Bar dataKey="count" name="Number of Shipments" fill="#10B981" radius={[0, 8, 8, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function TransporterTable({ data }) {
  if (!data || data.length === 0) {
    return <div style={{ textAlign: "center", color: "#94A3B8", padding: "30px" }}>No transporter data available</div>;
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #E2E8F0" }}>
            <th style={{ textAlign: "left", padding: "12px 8px", fontWeight: 600, color: "#64748B" }}>Transporter</th>
            <th style={{ textAlign: "right", padding: "12px 8px", fontWeight: 600, color: "#64748B" }}>Shipments</th>
            <th style={{ textAlign: "right", padding: "12px 8px", fontWeight: 600, color: "#64748B" }}>On-Time</th>
            <th style={{ textAlign: "right", padding: "12px 8px", fontWeight: 600, color: "#64748B" }}>Rate</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => (
            <tr key={idx} style={{ borderBottom: "1px solid #F1F5F9" }}>
              <td style={{ padding: "12px 8px", fontWeight: 600, color: "#1E293B" }}>{item.name}</td>
              <td style={{ textAlign: "right", padding: "12px 8px", color: "#475569" }}>{item.total_shipments}</td>
              <td style={{ textAlign: "right", padding: "12px 8px", color: "#475569" }}>{item.on_time_deliveries}</td>
              <td style={{ textAlign: "right", padding: "12px 8px" }}>
                <span style={{
                  background: item.on_time_percentage >= 90 ? "#D1FAE5" : item.on_time_percentage >= 70 ? "#FEF3C7" : "#FEE2E2",
                  color: item.on_time_percentage >= 90 ? "#059669" : item.on_time_percentage >= 70 ? "#D97706" : "#DC2626",
                  padding: "4px 10px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 600,
                  display: "inline-block"
                }}>
                  {formatPercent(item.on_time_percentage)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OverdueAlertsTable({ data, onViewBackOrder }) {
  if (!data || data.length === 0) {
    return <div style={{ textAlign: "center", color: "#94A3B8", padding: "30px" }}>No overdue shipments</div>;
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #E2E8F0" }}>
            <th style={{ textAlign: "left", padding: "12px 8px", fontWeight: 600, color: "#64748B" }}>BackOrder #</th>
            <th style={{ textAlign: "left", padding: "12px 8px", fontWeight: 600, color: "#64748B" }}>Customer</th>
            <th style={{ textAlign: "left", padding: "12px 8px", fontWeight: 600, color: "#64748B" }}>Expected Date</th>
            <th style={{ textAlign: "center", padding: "12px 8px", fontWeight: 600, color: "#64748B" }}>Overdue</th>
            <th style={{ textAlign: "left", padding: "12px 8px", fontWeight: 600, color: "#64748B" }}>Reason</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr
              key={item.id}
              style={{ borderBottom: "1px solid #F1F5F9", cursor: "pointer", transition: "background 0.2s" }}
              onClick={() => onViewBackOrder && onViewBackOrder(item.id)}
              onMouseEnter={(e) => e.currentTarget.style.background = "#F8FAFC"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <td style={{ padding: "12px 8px", fontWeight: 600, color: "#2563EB" }}>{item.back_order_number}</td>
              <td style={{ padding: "12px 8px", color: "#1E293B" }}>{item.customer_name}</td>
              <td style={{ padding: "12px 8px", color: "#475569" }}>{item.expected_dispatch_date}</td>
              <td style={{ textAlign: "center", padding: "12px 8px" }}>
                <span style={{
                  background: "#FEE2E2",
                  color: "#DC2626",
                  padding: "4px 10px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 700,
                  display: "inline-block"
                }}>
                  {item.overdue_days} days
                </span>
              </td>
              <td style={{ padding: "12px 8px", color: "#64748B", maxWidth: 200, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {item.reason}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RecentBackordersTable({ data, onViewBackOrder }) {
  if (!data || data.length === 0) {
    return <div style={{ textAlign: "center", color: "#94A3B8", padding: "40px" }}>No backorders found</div>;
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #E2E8F0" }}>
            <th style={{ textAlign: "left", padding: "14px 10px", fontWeight: 600, color: "#64748B" }}>BackOrder #</th>
            <th style={{ textAlign: "left", padding: "14px 10px", fontWeight: 600, color: "#64748B" }}>Order #</th>
            <th style={{ textAlign: "left", padding: "14px 10px", fontWeight: 600, color: "#64748B" }}>Customer</th>
            <th style={{ textAlign: "left", padding: "14px 10px", fontWeight: 600, color: "#64748B" }}>Status</th>
            <th style={{ textAlign: "left", padding: "14px 10px", fontWeight: 600, color: "#64748B" }}>Expected Date</th>
            <th style={{ textAlign: "left", padding: "14px 10px", fontWeight: 600, color: "#64748B" }}>Transporter</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr
              key={item.id}
              style={{ borderBottom: "1px solid #F1F5F9", cursor: "pointer", transition: "background 0.2s" }}
              onClick={() => onViewBackOrder && onViewBackOrder(item.id)}
              onMouseEnter={(e) => e.currentTarget.style.background = "#F8FAFC"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <td style={{ padding: "14px 10px", fontWeight: 600, color: "#2563EB" }}>{item.back_order_number}</td>
              <td style={{ padding: "14px 10px", color: "#475569" }}>{item.order_number}</td>
              <td style={{ padding: "14px 10px", color: "#1E293B", fontWeight: 500 }}>{item.customer_name}</td>
              <td style={{ padding: "14px 10px" }}>
                <span style={{
                  background: getStatusBgColor(item.status),
                  color: getStatusColor(item.status),
                  padding: "4px 10px",
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 600,
                  display: "inline-block"
                }}>
                  {item.status_label || item.status}
                </span>
              </td>
              <td style={{ padding: "14px 10px", color: "#475569" }}>
                {item.expected_dispatch_date || "—"}
                {item.days_status && (
                  <span style={{ display: "block", fontSize: 11, color: item.days_status.includes("overdue") ? "#DC2626" : "#64748B", marginTop: 2 }}>
                    {item.days_status}
                  </span>
                )}
              </td>
              <td style={{ padding: "14px 10px", color: "#64748B" }}>{item.transporter}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export default function LogisticsDashboard({ role: propRole }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(propRole || "employee");

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get("/logistics/dashboard/");
      setData(response.data);
      setRole(response.data.role || propRole || "employee");
    } catch (err) {
      console.error("Failed to fetch logistics dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleViewBackOrder = (id) => {
    // Navigate to backorder detail page
    window.location.href = `/${role}/logistics/back-orders/${id}`;
  };

  const {
    summary_cards,
    status_distribution,
    weekly_dispatch_trend,
    recent_backorders,
    category_breakdown,
    overdue_alerts,
    top_transporters,
  } = data || {};

  const formatDateRange = () => {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${monthStart.getDate()} ${months[monthStart.getMonth()]} – ${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`;
  };

  if (loading) {
    return (
      <div className="dashboard-wrapper">
        <div className="dashboard-banner" style={{ backgroundImage: `url(${dashboardBanner})` }}>
          <div className="dashboard-title">Logistics Dashboard</div>
        </div>
        <div className="stats-row">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="stat-card skeleton" style={{ height: 110 }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper" style={{ backgroundColor: "#F8FAFC", paddingBottom: "40px" }}>
      {/* ─── BANNER ─── */}
      <div
        className="dashboard-banner"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(${dashboardBanner})`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 40px",
          height: "180px",
          borderRadius: "16px"
        }}
      >
        <div>
          <div className="dashboard-title" style={{ fontSize: "32px", textShadow: "0 2px 4px rgba(0,0,0,0.2)" }}>
            Logistics Dashboard
          </div>
          <div style={{ color: "white", opacity: 0.9, marginTop: 4 }}>
            {formatDateRange()} • {role === "manager" ? "Manager View" : "My Shipments"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => window.location.href = `/${role}/logistics/back-orders`}
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.3)",
              color: "white",
              padding: "10px 20px",
              borderRadius: 10,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 13,
              backdropFilter: "blur(4px)"
            }}
          >
            View All BackOrders →
          </button>
        </div>
      </div>

      {/* ─── STAT CARDS ─── */}
      <div className="stats-row" style={{ marginTop: "-40px", position: "relative", zIndex: 5 }}>
        <StatCard
          label="Pending Dispatch"
          value={summary_cards?.pending_dispatch ?? 0}
          subtext="Awaiting processing"
          color="#F59E0B"
        />
        <StatCard
          label="In-Transit"
          value={summary_cards?.in_transit ?? 0}
          subtext="Shipments on the way"
          color="#3B82F6"
        />
        <StatCard
          label="Delayed Shipments"
          value={summary_cards?.delayed_shipments ?? 0}
          subtext="Past expected date"
          color="#EF4444"
        />
        <StatCard
          label="On-Time Delivery"
          value={formatPercent(summary_cards?.on_time_delivery_rate ?? 0)}
          subtext={`${summary_cards?.completed_this_month ?? 0} completed this month`}
          color="#10B981"
        />
      </div>

      {/* ─── ROW 1: Status Distribution + Weekly Trend ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 26, marginTop: 40 }}>
        {/* Status Distribution Card */}
        <div style={{ background: "white", padding: 24, borderRadius: 16, border: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: "#0F172A" }}>Shipment Status</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#475569", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 6, padding: "4px 10px" }}>
              All Statuses ▾
            </span>
          </div>
          <StatusDonutChart data={status_distribution} />
        </div>

        {/* Weekly Trend Card */}
        <div style={{ background: "white", padding: 24, borderRadius: 16, border: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: "#0F172A" }}>Weekly Dispatch Trend</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#475569", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 6, padding: "4px 10px" }}>
              Last 7 days ▾
            </span>
          </div>
          <WeeklyTrendChart data={weekly_dispatch_trend} />
        </div>
      </div>

      {/* ─── ROW 2: Category Breakdown + Top Transporters ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 26, marginTop: 26 }}>
        {/* Category Breakdown Card */}
        <div style={{ background: "white", padding: 24, borderRadius: 16, border: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: "#0F172A" }}>Domestic vs International</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#475569", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 6, padding: "4px 10px" }}>
              Current Year ▾
            </span>
          </div>
          <CategoryBarChart data={category_breakdown} />
          <div style={{ display: "flex", justifyContent: "space-around", marginTop: 20, paddingTop: 16, borderTop: "1px solid #F1F5F9" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 13, color: "#64748B" }}>Domestic Shipments</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#3B82F6" }}>{category_breakdown?.domestic?.count || 0}</div>
              <div style={{ fontSize: 12, color: "#94A3B8" }}>{formatQuantity(category_breakdown?.domestic?.quantity || 0)} units</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 13, color: "#64748B" }}>International Shipments</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#10B981" }}>{category_breakdown?.international?.count || 0}</div>
              <div style={{ fontSize: 12, color: "#94A3B8" }}>{formatQuantity(category_breakdown?.international?.quantity || 0)} units</div>
            </div>
          </div>
        </div>

        {/* Top Transporters Card */}
        <div style={{ background: "white", padding: 24, borderRadius: 16, border: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: "#0F172A" }}>Top Transporters</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#475569", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 6, padding: "4px 10px" }}>
              On-Time Performance ▾
            </span>
          </div>
          <TransporterTable data={top_transporters} />
        </div>
      </div>

      {/* ─── ROW 3: Overdue Alerts ─── */}
      {overdue_alerts && overdue_alerts.length > 0 && (
        <div style={{ marginTop: 26, background: "white", padding: 24, borderRadius: 16, border: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: "#EF4444", display: "flex", alignItems: "center", gap: 8 }}>
              ⚠️ Overdue Alerts
              <span style={{ fontSize: 12, fontWeight: 600, background: "#FEE2E2", color: "#DC2626", padding: "2px 8px", borderRadius: 20 }}>
                {overdue_alerts.length}
              </span>
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#475569", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 6, padding: "4px 10px" }}>
              Requires Immediate Attention ▾
            </span>
          </div>
          <OverdueAlertsTable data={overdue_alerts} onViewBackOrder={handleViewBackOrder} />
        </div>
      )}

      {/* ─── ROW 4: Recent BackOrders ─── */}
      <div style={{ marginTop: 26, background: "white", padding: 24, borderRadius: 16, border: "1px solid #E2E8F0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: "#0F172A" }}>Recent BackOrders</span>
          <button
            onClick={() => window.location.href = `/${role}/logistics/back-orders`}
            style={{
              fontSize: 13,
 fontWeight: 600,
              color: "#2563EB",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4
            }}
          >
            View All →
          </button>
        </div>
        <RecentBackordersTable data={recent_backorders} onViewBackOrder={handleViewBackOrder} />
      </div>
    </div>
  );
}