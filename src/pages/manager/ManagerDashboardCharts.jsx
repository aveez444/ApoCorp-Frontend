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
  Cell,
} from "recharts";

const LINE_COLORS    = ["#2563EB", "#7C3AED", "#10B981", "#F59E0B", "#EF4444"];
const DONUT_COLORS   = ["#1E3A8A", "#2563EB", "#3B82F6", "#60A5FA", "#93C5FD"];

function formatCr(n) {
  if (!n) return "0";
  if (n >= 10000000) return `${(n / 10000000).toFixed(0)} Cr`;
  if (n >= 100000)   return `${(n / 100000).toFixed(1)} L`;
  return n.toLocaleString("en-IN");
}

function formatNum(n) {
  if (!n || n === 0) return "₹0";
  const absN = Math.abs(Number(n));
  if (absN >= 10000000) return `₹${(absN / 10000000).toFixed(2)} Cr`;
  if (absN >= 100000)   return `₹${(absN / 100000).toFixed(2)} L`;
  return `₹${Number(n).toLocaleString("en-IN")}`;
}

const card = {
  background: "#fff",
  borderRadius: 16,
  padding: "26px",
  border: "1px solid #E2E8F0",
  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
};

const pill = {
  fontSize: 12,
  fontWeight: 600,
  color: "#475569",
  background: "#F8FAFC",
  border: "1px solid #E2E8F0",
  borderRadius: 6,
  padding: "4px 10px",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
};

function CardHeader({ title, right }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
      <span style={{ fontSize: 18, fontWeight: 800, color: "#0F172A" }}>{title}</span>
      {right && <span style={pill}>{right} ▾</span>}
    </div>
  );
}

function MoMChart({ data }) {
  if (!data?.sales_reps) return (
    <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center", color: "#94A3B8" }}>No historical data available</div>
  );

  const reps = Object.keys(data.sales_reps);
  const chartData = data.months.map((m, i) => {
    const row = { month: m };
    reps.forEach((r) => { row[r] = data.sales_reps[r].revenue[i]; });
    return row;
  });

  return (
    <>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <span style={pill}>{data.year || "2026"} Range ▾</span>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {reps.map((rep, i) => (
            <div key={rep} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: '#64748B', fontWeight: 600 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: LINE_COLORS[i % LINE_COLORS.length] }} />
              {rep}
            </div>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={chartData}>
          <defs>
            {reps.map((rep, i) => (
              <linearGradient key={rep} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={LINE_COLORS[i % LINE_COLORS.length]} stopOpacity={0.3} />
                <stop offset="95%" stopColor={LINE_COLORS[i % LINE_COLORS.length]} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748B", fontWeight: 600 }} axisLine={false} tickLine={false} dy={10} />
          <YAxis tickFormatter={formatCr} tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} width={40} />
          <Tooltip formatter={(val) => formatNum(val)} contentStyle={{ borderRadius: 12, border: "none", boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: 12 }} />
          {reps.map((rep, i) => (
            <Area key={rep} type="monotone" dataKey={rep} stroke={LINE_COLORS[i % LINE_COLORS.length]} fill={`url(#grad-${i})`} strokeWidth={3} dot={{ r: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </>
  );
}

function LeaderBoard({ data, dateRange }) {
  if (!data || data.length === 0) return <div style={{ color: "#94A3B8", textAlign: 'center', padding: '20px' }}>No leaderboard data</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {data.map((rep, i) => (
        <div key={i} style={{ padding: "0 0 16px 0", borderBottom: i !== data.length - 1 ? "1px solid #F1F5F9" : "none" }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#334155" }}>{rep.username || rep.name}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#2563EB" }}>{rep.achievement_pct || 0}%</span>
          </div>
          <div style={{ height: 10, background: "#F1F5F9", borderRadius: 10, overflow: "hidden", marginBottom: 6, border: '1px solid #E2E8F0' }}>
            <div style={{ width: `${Math.min(rep.achievement_pct || 0, 100)}%`, height: "100%", background: "linear-gradient(90deg, #1E3A8A, #2563EB)", borderRadius: 10 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: 12, color: '#64748B' }}>
            <span style={{ fontWeight: 800, color: '#0F172A' }}>{formatNum(rep.achieved)}</span> / {formatNum(rep.target)}
          </div>
        </div>
      ))}
    </div>
  );
}

function RevenueByProduct({ data }) {
  if (!data || data.length === 0) return <div style={{ color: "#94A3B8", textAlign: 'center' }}>No revenue data</div>;
  const total = data.reduce((s, d) => s + (d.revenue || 0), 0);
  return (
    <div style={{ display: "flex", gap: 30, alignItems: "center", justifyContent: 'center' }}>
      <div style={{ position: "relative" }}>
        <PieChart width={180} height={180}>
          <Pie data={data.map(p => ({ name: p.product, value: p.revenue }))} cx={90} cy={90} innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value" strokeWidth={0}>
            {data.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
          </Pie>
        </PieChart>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A" }}>{formatCr(total)}</div>
          <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600, textTransform: 'uppercase' }}>Revenue</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {data.map((p, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
            <span style={{ color: "#475569", fontWeight: 600 }}>{p.product}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SalesFunnel({ data }) {
  if (!data) return <div style={{ color: "#94A3B8" }}>No funnel data</div>;
  const stages = [
    { label: "Enquiry", value: data.enquiry || 0, color: "#1E293B" },
    { label: "Quote", value: data.quotation || 0, color: "#334155" },
    { label: "Orders", value: data.orders || 0, color: "#2563EB" },
    { label: "Dispatch", value: data.dispatch || 0, color: "#10B981" },
    { label: "Invoiced", value: data.invoicing || 0, color: "#8B5CF6" },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {stages.map((s, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#0F172A' }}>{s.value}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', height: 50, borderRadius: 10, overflow: 'hidden', border: '1px solid #E2E8F0' }}>
        {stages.map((s, i) => (
          <div key={i} style={{ flex: 1, background: s.color, borderRight: i !== stages.length - 1 ? '2px solid white' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 10, fontWeight: 700 }}>
            {i > 0 && stages[i-1].value > 0 ? `${Math.round((s.value / stages[i-1].value) * 100)}%` : ''}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ManagerDashboardCharts({ momSalesTarget, revenueByProduct, leaderboard, salesFunnel, dateRange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 24 }}>
        <div style={card}><CardHeader title="Revenue Trend" /><MoMChart data={momSalesTarget} /></div>
        <div style={card}><CardHeader title="Leaderboard" /><LeaderBoard data={leaderboard} /></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 24 }}>
        <div style={card}><CardHeader title="Product Mix" /><RevenueByProduct data={revenueByProduct} /></div>
        <div style={card}><CardHeader title="Conversion Funnel" /><SalesFunnel data={salesFunnel} /></div>
      </div>
    </div>
  );
}