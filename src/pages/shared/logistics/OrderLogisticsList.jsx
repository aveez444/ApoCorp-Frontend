// pages/shared/logistics/OrderLogisticsList.jsx
import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../../api/axios'
import banner from '../../../assets/dashboard-banner.png'

const PRIMARY = "#122C41"
const BORDER = "#e2e8f0"
const FONT = "'Inter', 'Segoe UI', sans-serif"

const fmtDate = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const fmtAmt = (n) => `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n ?? 0)}`

function StatusBadge({ status, type = 'order' }) {
  const configs = {
    order: {
      COMPLETED: { bg: "#e6fff5", color: "#0a9e6e", label: "Completed" },
      IN_PROGRESS: { bg: "#e6f0ff", color: "#1a7fd4", label: "In Progress" },
      HOLD: { bg: "#fef2f2", color: "#dc2626", label: "On Hold" },
    },
    dispatch: {
      DELIVERED: { bg: "#e6fff5", color: "#0a9e6e", label: "Delivered" },
      IN_TRANSIT: { bg: "#e6f0ff", color: "#1a7fd4", label: "In Transit" },
      INVOICED: { bg: "#fff3e0", color: "#e65100", label: "Invoiced" },
      PENDING: { bg: "#fffbe6", color: "#c8860a", label: "Pending" },
      CANCELLED: { bg: "#f1f5f9", color: "#64748b", label: "Cancelled" },
    }
  }
  const s = configs[type][status] || { bg: "#f1f5f9", color: "#64748b", label: status }
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: "4px 10px", borderRadius: 20,
      fontSize: 11, fontWeight: 600,
      display: "inline-flex", alignItems: "center", gap: 5
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.color }} />
      {s.label}
    </span>
  )
}

function LogisticsOrderCard({ order, onClick }) {
  const [hovered, setHovered] = useState(false)
  const completionPercent = order.completion_percentage || 0
  
  return (
    <div
      onClick={() => onClick(order.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#fff",
        border: `1px solid ${hovered ? PRIMARY : BORDER}`,
        borderRadius: 14,
        padding: "20px 24px",
        cursor: "pointer",
        transition: "all 0.2s ease",
        boxShadow: hovered ? "0 8px 24px rgba(18,44,65,0.12)" : "0 1px 4px rgba(0,0,0,0.05)",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, letterSpacing: 0.5, marginBottom: 4 }}>
            ORDER #{order.number}
          </div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: PRIMARY }}>
            {order.customer_name}
          </h3>
        </div>
        <StatusBadge status={order.status} type="order" />
      </div>
      
      <div style={{ display: "flex", gap: 16, marginBottom: 16, fontSize: 12, color: "#64748b" }}>
        <span>PO: {order.po_number || '—'}</span>
        <span>•</span>
        <span>Created: {fmtDate(order.created_at)}</span>
        <span>•</span>
        <span>Dispatches: {order.total_backorders}</span>
      </div>
      
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748b", marginBottom: 4 }}>
          <span>Dispatch Progress</span>
          <span style={{ fontWeight: 600, color: PRIMARY }}>{completionPercent}%</span>
        </div>
        <div style={{ height: 6, background: "#e2e8f0", borderRadius: 3, overflow: "hidden" }}>
          <div style={{ width: `${completionPercent}%`, height: "100%", background: PRIMARY, borderRadius: 3 }} />
        </div>
      </div>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 24 }}>
          <div>
            <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase" }}>Total Qty</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: PRIMARY }}>
              {order.total_quantity?.toFixed(0) || 0}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase" }}>Dispatched</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#0a9e6e" }}>
              {order.dispatched_quantity?.toFixed(0) || 0}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase" }}>Remaining</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#c8860a" }}>
              {order.remaining_quantity?.toFixed(0) || 0}
            </div>
          </div>
        </div>
        
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          color: PRIMARY, fontSize: 12, fontWeight: 600,
          opacity: hovered ? 1 : 0.6,
          transition: "opacity 0.2s"
        }}>
          View Full Logistics
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  )
}

export default function OrderLogisticsList({ role = 'employee' }) {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchPO, setSearchPO] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      const params = {}
      if (searchPO) params.po_number = searchPO
      if (statusFilter) params.status = statusFilter
      
      const res = await api.get("/orders/orders/", { params })
      
      // Fetch logistics summary for each order
      const ordersWithLogistics = await Promise.all(
        res.data.map(async (order) => {
          try {
            const logisticsRes = await api.get(`/logistics/back-orders/order-logistics/${order.id}/`)
            const data = logisticsRes.data
            return {
              id: order.id,
              number: order.order_number,
              customer_name: data.customer?.name || '—',
              po_number: order.oa?.quotation?.po_number || '—',
              status: order.status,
              created_at: order.created_at,
              total_quantity: data.summary.total_order_quantity,
              dispatched_quantity: data.summary.total_dispatched_quantity,
              remaining_quantity: data.summary.remaining_quantity,
              completion_percentage: data.summary.completion_percentage,
              total_backorders: data.summary.total_backorders,
              total_invoices: data.summary.total_invoices,
            }
          } catch (err) {
            return {
              id: order.id,
              number: order.order_number,
              customer_name: '—',
              po_number: '—',
              status: order.status,
              created_at: order.created_at,
              total_quantity: 0,
              dispatched_quantity: 0,
              remaining_quantity: 0,
              completion_percentage: 0,
            }
          }
        })
      )
      
      setOrders(ordersWithLogistics)
    } catch (err) {
      console.error("Error fetching orders:", err)
    } finally {
      setLoading(false)
    }
  }, [searchPO, statusFilter])
  
  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])
  
  const handleOrderClick = (orderId) => {
    navigate(`/${role}/logistics/order-logistics/${orderId}`)
  }
  
  return (
    <div style={{ fontFamily: FONT, background: "#f1f5f9", minHeight: "100vh", padding: "24px 32px" }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      
      {/* Banner */}
      <div style={{
        backgroundImage: `url(${banner})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        borderRadius: 16,
        padding: "32px 40px",
        marginBottom: 32,
        position: "relative",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(135deg, rgba(18,44,65,0.85), rgba(18,44,65,0.65))",
          borderRadius: 16,
        }} />
        <div style={{ position: "relative", zIndex: 2 }}>
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, color: "rgba(255,255,255,0.6)", marginBottom: 8 }}>
            COMPREHENSIVE LOGISTICS VIEW
          </p>
          <h1 style={{ color: "#fff", fontSize: 28, margin: 0, fontWeight: 700 }}>
            Order Logistics Dashboard
          </h1>
          <p style={{ color: "rgba(255,255,255,0.8)", marginTop: 8, fontSize: 14 }}>
            Track complete dispatch history, invoices, and shipment status for every order
          </p>
        </div>
      </div>
      
      {/* Filters */}
      <div style={{
        background: "#fff",
        borderRadius: 12,
        padding: "20px 24px",
        marginBottom: 24,
        border: `1px solid ${BORDER}`,
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto auto", gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, display: "block" }}>
              PO Number / Order Number
            </label>
            <input
              type="text"
              value={searchPO}
              onChange={(e) => setSearchPO(e.target.value)}
              placeholder="Search by PO or Order Number"
              style={{
                width: "100%",
                padding: "10px 14px",
                border: `1px solid ${BORDER}`,
                borderRadius: 8,
                fontSize: 13,
                fontFamily: FONT,
                outline: "none",
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, display: "block" }}>
              Order Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                border: `1px solid ${BORDER}`,
                borderRadius: 8,
                fontSize: 13,
                fontFamily: FONT,
                background: "#fff",
              }}
            >
              <option value="">All Status</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="HOLD">On Hold</option>
            </select>
          </div>
          <button
            onClick={fetchOrders}
            style={{
              background: PRIMARY,
              color: "#fff",
              border: "none",
              padding: "0 24px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: FONT,
              marginTop: 24,
            }}
          >
            Search
          </button>
          <button
            onClick={() => { setSearchPO(""); setStatusFilter("") }}
            style={{
              background: "#fff",
              color: "#64748b",
              border: `1px solid ${BORDER}`,
              padding: "0 24px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: FONT,
              marginTop: 24,
            }}
          >
            Clear
          </button>
        </div>
      </div>
      
      {/* Orders Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, background: "#fff", borderRadius: 12 }}>
          <div style={{ width: 32, height: 32, border: `3px solid ${BORDER}`, borderTopColor: PRIMARY, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
          <p style={{ marginTop: 16, color: "#64748b" }}>Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, background: "#fff", borderRadius: 12 }}>
          <p style={{ color: "#64748b" }}>No orders found</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 16, animation: "fadeIn 0.3s ease" }}>
          {orders.map(order => (
            <LogisticsOrderCard key={order.id} order={order} onClick={handleOrderClick} />
          ))}
        </div>
      )}
    </div>
  )
}