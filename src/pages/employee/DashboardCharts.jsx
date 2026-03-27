import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from "recharts";

const COLORS = ["#6366F1", "#8B5CF6", "#EC4899", "#F43F5E", "#F97316"];

function formatNum(n) {
  if (!n) return "0";
  n = Number(n);
  if (n >= 10000000) return (n / 10000000).toFixed(2) + " Cr";
  if (n >= 100000) return (n / 100000).toFixed(2) + " L";
  return n.toLocaleString("en-IN");
}

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(8px)",
        padding: "12px 16px",
        border: "1px solid #E2E8F0",
        borderRadius: "12px",
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
      }}>
        <p style={{ margin: 0, fontSize: "12px", color: "#64748B", fontWeight: 600 }}>{label}</p>
        <p style={{ margin: "4px 0 0", fontSize: "15px", color: "#1E293B", fontWeight: 700 }}>
          ₹{formatNum(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
}

function RevenueChart({ data }) {
  if (!data || data.length === 0) {
    return <div style={styles.emptyChart}>No sales data yet</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
        <XAxis 
          dataKey="month" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: "#94A3B8", fontSize: 12 }}
          dy={10}
        />
        <YAxis 
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: "#94A3B8", fontSize: 11 }}
          tickFormatter={(v) => formatNum(v)}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#6366F1"
          strokeWidth={4}
          fillOpacity={1}
          fill="url(#colorSales)"
          dot={{ r: 4, fill: "#6366F1", strokeWidth: 2, stroke: "#fff" }}
          activeDot={{ r: 8, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function DonutChart({ data }) {
  if (!data || data.length === 0) return <div style={styles.emptyChart}>No data</div>;
  const total = data.reduce((a, b) => a + (b.revenue || 0), 0);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      <ResponsiveContainer width="55%" height={240}>
        <PieChart>
          <Pie
            data={data}
            dataKey="revenue"
            innerRadius={65}
            outerRadius={90}
            paddingAngle={5}
            stroke="none"
          >
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} cornerRadius={6} />
            ))}
          </Pie>
          <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
            <tspan x="50%" dy="-2" fontSize="18" fontWeight="800" fill="#1E293B">₹{formatNum(total)}</tspan>
            <tspan x="50%" dy="20" fontSize="11" fontWeight="600" fill="#94A3B8" textTransform="uppercase">Total</tspan>
          </text>
        </PieChart>
      </ResponsiveContainer>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
        {data.map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS[i % COLORS.length] }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>{item.product}</div>
              <div style={{ fontSize: "11px", color: "#94A3B8" }}>{((item.revenue / total) * 100).toFixed(1)}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardCharts({ momSales, revenueByProduct, loading }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "24px" }}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h3 style={styles.title}>MOM Sales & Target</h3>
          <p style={styles.sub}>Performance trend against objectives</p>
        </div>
        {loading ? <div className="skeleton" style={{ height: 260 }} /> : <RevenueChart data={momSales} />}
      </div>

      <div style={styles.card}>
        <div style={styles.header}>
          <h3 style={styles.title}>Product Share</h3>
          <p style={styles.sub}>Revenue mix by category</p>
        </div>
        {loading ? <div className="skeleton" style={{ height: 260 }} /> : <DonutChart data={revenueByProduct} />}
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: "#fff",
    padding: "24px",
    borderRadius: "20px",
    border: "1px solid #E2E8F0",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)"
  },
  header: { marginBottom: "20px" },
  title: { fontSize: "17px", fontWeight: 700, color: "#1E293B", margin: 0 },
  sub: { fontSize: "12px", color: "#64748B", margin: "4px 0 0" },
  emptyChart: { height: 260, display: "flex", alignItems: "center", justifyContent: "center", color: "#94A3B8", fontSize: "14px" }
};