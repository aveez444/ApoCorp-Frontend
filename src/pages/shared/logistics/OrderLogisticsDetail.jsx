// pages/shared/logistics/OrderLogisticsDetail.jsx
import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../../api/axios'

const PRIMARY = "#122C41"
const ACCENT = "#1a7fd4"
const BORDER = "#e2e8f0"
const FONT = "'Inter', 'Segoe UI', sans-serif"

const fmtDate = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const fmtDateTime = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const fmtAmt = (n, currency = 'INR') => {
  const val = n ?? 0
  if (currency === 'INR') return `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(val)}`
  return `${currency} ${new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(val)}`
}

function StatusBadge({ status, type = 'dispatch' }) {
  const configs = {
    dispatch: {
      DELIVERED: { bg: "#e6fff5", color: "#0a9e6e", label: "Delivered" },
      IN_TRANSIT: { bg: "#e6f0ff", color: "#1a7fd4", label: "In Transit" },
      OUT_FOR_DELIVERY: { bg: "#e6f0ff", color: "#1a7fd4", label: "Out for Delivery" },
      INVOICED: { bg: "#fff3e0", color: "#e65100", label: "Invoiced" },
      PENDING: { bg: "#fffbe6", color: "#c8860a", label: "Pending" },
      DELAYED: { bg: "#fef2f2", color: "#dc2626", label: "Delayed" },
      RETURNED: { bg: "#fef2f2", color: "#dc2626", label: "Returned" },
      CANCELLED: { bg: "#f1f5f9", color: "#64748b", label: "Cancelled" },
      COMPLETED: { bg: "#e6fff5", color: "#0a9e6e", label: "Completed" },
    },
    invoice: {
      CONFIRMED: { bg: "#e6fff5", color: "#0a9e6e", label: "Confirmed" },
      DRAFT: { bg: "#fffbe6", color: "#c8860a", label: "Draft" },
      CANCELLED: { bg: "#fef2f2", color: "#dc2626", label: "Cancelled" },
    }
  }
  const s = configs[type]?.[status] || { bg: "#f1f5f9", color: "#64748b", label: status || 'Unknown' }
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: "4px 12px", borderRadius: 20,
      fontSize: 11, fontWeight: 600,
      display: "inline-flex", alignItems: "center", gap: 5,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.color }} />
      {s.label}
    </span>
  )
}

function DetailModal({ isOpen, onClose, title, children, size = 'medium' }) {
  if (!isOpen) return null
  
  const sizeStyles = {
    small: { maxWidth: 500 },
    medium: { maxWidth: 700 },
    large: { maxWidth: 1000 },
  }
  
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center",
      justifyContent: "center", zIndex: 1000, fontFamily: FONT
    }} onClick={onClose}>
      <div style={{
        background: "#fff", borderRadius: 16, width: "90%", maxHeight: "85vh",
        overflow: "auto", ...sizeStyles[size]
      }} onClick={e => e.stopPropagation()}>
        <div style={{
          padding: "20px 24px", borderBottom: `1px solid ${BORDER}`,
          display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: PRIMARY }}>{title}</h3>
          <button onClick={onClose} style={{
            background: "none", border: "none", fontSize: 24, cursor: "pointer",
            color: "#64748b", padding: "0 8px"
          }}>×</button>
        </div>
        <div style={{ padding: "20px 24px" }}>
          {children}
        </div>
      </div>
    </div>
  )
}

function CollapsibleSection({ title, badge, defaultOpen = false, children }) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  
  return (
    <div style={{
      border: `1px solid ${BORDER}`,
      borderRadius: 12,
      marginBottom: 16,
      overflow: "hidden",
    }}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: "14px 20px",
          background: "#fafbfc",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: isOpen ? `1px solid ${BORDER}` : "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: PRIMARY }}>{title}</span>
          {badge && <StatusBadge status={badge} />}
        </div>
        <span style={{ color: "#64748b", fontSize: 18 }}>
          {isOpen ? "−" : "+"}
        </span>
      </div>
      {isOpen && (
        <div style={{ padding: "16px 20px" }}>
          {children}
        </div>
      )}
    </div>
  )
}

function DetailRow({ label, value, monospace }) {
  return (
    <div style={{ display: "flex", padding: "8px 0", borderBottom: `1px solid ${BORDER}`, fontSize: 13 }}>
      <div style={{ width: 140, fontWeight: 500, color: "#64748b" }}>{label}</div>
      <div style={{ flex: 1, color: PRIMARY, fontFamily: monospace ? "monospace" : "inherit" }}>
        {value || "—"}
      </div>
    </div>
  )
}

function AddressCard({ title, address }) {
  if (!address) return null
  
  return (
    <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8, fontSize: 12, lineHeight: 1.5 }}>
      <strong style={{ color: PRIMARY, display: "block", marginBottom: 8 }}>{title}</strong>
      <div style={{ color: "#334155" }}>
        <div>{address.entity_name}</div>
        <div>{address.address_line}</div>
        <div>{address.city && `${address.city}, `}{address.state && `${address.state} - ${address.pincode}`}</div>
        {address.contact_person && <div>Attn: {address.contact_person}</div>}
        {address.contact_email && <div>Email: {address.contact_email}</div>}
        {address.contact_number && <div>Phone: {address.contact_number}</div>}
        {address.gst_number && <div>GST: {address.gst_number}</div>}
      </div>
    </div>
  )
}

function BackOrderCard({ backorder, onViewInvoice, orderCurrency }) {
  const [expanded, setExpanded] = useState(false)
  
  const totalQty = backorder.total_quantity || backorder.line_items?.reduce((sum, i) => sum + (i.quantity_dispatching || 0), 0) || 0
  
  return (
    <div style={{
      borderLeft: `4px solid ${backorder.status === 'DELIVERED' ? '#0a9e6e' : backorder.status === 'IN_TRANSIT' ? '#1a7fd4' : backorder.status === 'CANCELLED' ? '#64748b' : '#c8860a'}`,
      background: "#fff",
      borderRadius: 12,
      marginBottom: 20,
      border: `1px solid ${BORDER}`,
      overflow: "hidden",
    }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          padding: "16px 20px",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          background: expanded ? "#fafbfc" : "#fff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 700, color: PRIMARY }}>
            {backorder.number}
          </span>
          <StatusBadge status={backorder.status} type="dispatch" />
          <span style={{ fontSize: 12, color: "#64748b" }}>{fmtDate(backorder.created_at)}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 12, fontWeight: 500, background: "#f1f5f9", padding: "2px 8px", borderRadius: 12 }}>
            {totalQty} units
          </span>
          {backorder.invoice && (
            <span style={{ fontSize: 11, color: ACCENT }}>
              Invoice: {backorder.invoice.number}
            </span>
          )}
          <span style={{ fontSize: 16, color: "#64748b" }}>{expanded ? "▲" : "▼"}</span>
        </div>
      </div>
      
      {expanded && (
        <div style={{ padding: "20px", borderTop: `1px solid ${BORDER}`, background: "#fff" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20, marginBottom: 20 }}>
            <div>
              <h4 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 600, color: PRIMARY }}>Dispatch Details</h4>
              <DetailRow label="Back Order No." value={backorder.number} monospace />
              <DetailRow label="Created" value={fmtDateTime(backorder.created_at)} />
              <DetailRow label="Last Updated" value={fmtDateTime(backorder.updated_at)} />
              <DetailRow label="Expected Dispatch" value={backorder.expected_dispatch_date ? fmtDate(backorder.expected_dispatch_date) : null} />
              {backorder.reason && <DetailRow label="Reason" value={backorder.reason} />}
            </div>
            
            <div>
              <h4 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 600, color: PRIMARY }}>Tracking Information</h4>
              <DetailRow label="Tracking Status" value={backorder.tracking?.status || backorder.status} />
              <DetailRow label="Current Location" value={backorder.tracking?.current_location || backorder.current_location || "—"} />
              <DetailRow label="ETD" value={backorder.tracking?.etd ? fmtDate(backorder.tracking.etd) : (backorder.etd ? fmtDate(backorder.etd) : null)} />
              {backorder.tracking?.remark && (
                <div style={{ marginTop: 8, padding: 8, background: "#fffbe6", borderRadius: 6, fontSize: 12 }}>
                  📋 {backorder.tracking.remark}
                </div>
              )}
            </div>
            
            {backorder.invoice && (
              <div>
                <h4 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 600, color: PRIMARY }}>Invoice Summary</h4>
                <DetailRow label="Invoice No." value={backorder.invoice.number} monospace />
                <DetailRow label="Invoice Date" value={fmtDate(backorder.invoice.date)} />
                <DetailRow label="Status" value={<StatusBadge status={backorder.invoice.status} type="invoice" />} />
                <DetailRow label="Amount" value={fmtAmt(backorder.invoice.amount, orderCurrency)} />
                {backorder.invoice.transporter && <DetailRow label="Transporter" value={backorder.invoice.transporter} />}
                {backorder.invoice.vehicle_number && <DetailRow label="Vehicle No." value={backorder.invoice.vehicle_number} />}
                {backorder.invoice.lr_number && <DetailRow label="LR/GR No." value={backorder.invoice.lr_number} />}
                <div style={{ marginTop: 12 }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onViewInvoice && onViewInvoice(backorder.invoice.id)
                    }}
                    style={{
                      padding: "6px 14px",
                      background: "#fff",
                      color: PRIMARY,
                      border: `1px solid ${PRIMARY}`,
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    View Full Invoice →
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {backorder.line_items && backorder.line_items.length > 0 && (
            <div>
              <h4 style={{ margin: "16px 0 12px", fontSize: 13, fontWeight: 600, color: PRIMARY }}>Line Items in this Dispatch</h4>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <th style={{ textAlign: "left", padding: "8px", color: "#64748b" }}>Part No.</th>
                      <th style={{ textAlign: "left", padding: "8px", color: "#64748b" }}>Description</th>
                      <th style={{ textAlign: "right", padding: "8px", color: "#64748b" }}>Qty</th>
                      <th style={{ textAlign: "right", padding: "8px", color: "#64748b" }}>Unit</th>
                      <th style={{ textAlign: "right", padding: "8px", color: "#64748b" }}>Unit Price</th>
                      <th style={{ textAlign: "right", padding: "8px", color: "#64748b" }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backorder.line_items.map((item, idx) => {
                      const qty = item.quantity_dispatching || item.quantity || 0
                      const price = item.unit_price || 0
                      return (
                        <tr key={idx} style={{ borderBottom: `1px solid ${BORDER}` }}>
                          <td style={{ padding: "8px", fontFamily: "monospace" }}>{item.part_no || "—"}</td>
                          <td style={{ padding: "8px" }}>{item.description || "—"}</td>
                          <td style={{ padding: "8px", textAlign: "right", fontWeight: 600 }}>{qty}</td>
                          <td style={{ padding: "8px", textAlign: "right" }}>{item.unit || "NOS"}</td>
                          <td style={{ padding: "8px", textAlign: "right" }}>{fmtAmt(price, orderCurrency)}</td>
                          <td style={{ padding: "8px", textAlign: "right" }}>{fmtAmt(qty * price, orderCurrency)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function OrderLogisticsDetail({ role = 'employee' }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.get(`/logistics/back-orders/order-logistics/${id}/`)
      setData(res.data)
    } catch (err) {
      console.error("Error loading order logistics:", err)
    } finally {
      setLoading(false)
    }
  }, [id])
  
  useEffect(() => {
    loadData()
  }, [loadData])
  
  const handleViewInvoice = (invoiceId) => {
    navigate(`/${role}/logistics/invoices/${invoiceId}`)
  }
  
  if (loading) {
    return (
      <div style={{ fontFamily: FONT, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f8fafc" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: `3px solid ${BORDER}`, borderTopColor: PRIMARY, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
          <p style={{ marginTop: 16, color: "#64748b" }}>Loading order logistics...</p>
        </div>
      </div>
    )
  }
  
  if (!data) {
    return (
      <div style={{ fontFamily: FONT, textAlign: "center", padding: 60, background: "#f8fafc", minHeight: "100vh" }}>
        <p>Order not found</p>
        <button onClick={() => navigate(`/${role}/logistics/order-logistics`)} style={{ marginTop: 16, padding: "8px 20px", background: PRIMARY, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>
          Back to Orders
        </button>
      </div>
    )
  }
  
  const { order, customer, oa, summary, line_items, backorders } = data
  const completionPercent = summary.completion_percentage || 0
  const currency = order.currency || 'INR'
  
  return (
    <div style={{ fontFamily: FONT, background: "#f8fafc", minHeight: "100vh" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      
      {/* Header */}
      <div style={{ background: PRIMARY, padding: "24px 32px" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          <button
            onClick={() => navigate(`/${role}/logistics/order-logistics`)}
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "none",
              color: "#fff",
              padding: "6px 14px",
              borderRadius: 8,
              fontSize: 12,
              cursor: "pointer",
              marginBottom: 16,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            ← Back to Orders
          </button>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#fff" }}>
                {order.number}
              </h1>
              <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.7)", fontSize: 14 }}>
                {customer.name} • OA: {oa.number || '—'} • PO: {oa.billing_address?.po_number || '—'}
              </p>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <StatusBadge status={order.invoice_status || order.status} type="dispatch" />
              <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
                Stage: {order.stage || '—'}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px", animation: "slideIn 0.3s ease" }}>
        
        {/* Summary Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 32 }}>
          {[
            { label: "Total Quantity", value: summary.total_order_quantity, color: PRIMARY },
            { label: "Dispatched", value: summary.total_dispatched_quantity, color: "#0a9e6e" },
            { label: "Remaining", value: summary.remaining_quantity, color: "#c8860a" },
            { label: "Dispatches", value: summary.total_backorders, color: ACCENT },
            { label: "Invoices", value: summary.total_invoices, color: "#8b5cf6" },
            { label: "Completion", value: `${completionPercent}%`, color: PRIMARY },
          ].map(stat => (
            <div key={stat.label} style={{
              background: "#fff",
              borderRadius: 12,
              padding: "16px 20px",
              border: `1px solid ${BORDER}`,
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}>
              <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", marginBottom: 8 }}>
                {stat.label}
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: stat.color }}>
                {typeof stat.value === 'number' ? stat.value.toFixed(0) : stat.value}
              </div>
            </div>
          ))}
        </div>
        
        {/* Progress Bar */}
        <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", marginBottom: 32, border: `1px solid ${BORDER}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: PRIMARY }}>Overall Dispatch Progress</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: PRIMARY }}>{completionPercent}%</span>
          </div>
          <div style={{ height: 8, background: "#e2e8f0", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ width: `${completionPercent}%`, height: "100%", background: PRIMARY, borderRadius: 4 }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontSize: 11, color: "#64748b" }}>
            <span>Total: {summary.total_order_quantity} units</span>
            <span>Dispatched: {summary.total_dispatched_quantity} units</span>
            <span>Remaining: {summary.remaining_quantity} units</span>
          </div>
        </div>
        
        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: `1px solid ${BORDER}`, flexWrap: "wrap" }}>
          {[
            { key: "overview", label: "Overview" },
            { key: "lineitems", label: "Line Items" },
            { key: "dispatches", label: "Dispatch Timeline" },
            { key: "documents", label: "Documents" },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: "10px 24px",
                background: activeTab === tab.key ? PRIMARY : "transparent",
                color: activeTab === tab.key ? "#fff" : "#64748b",
                border: "none",
                borderRadius: "8px 8px 0 0",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: FONT,
                transition: "all 0.2s",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 24, marginBottom: 24 }}>
              <CollapsibleSection title="Order Details" defaultOpen>
                <DetailRow label="Order Number" value={order.number} monospace />
                <DetailRow label="Order Category" value={order.category === 'DOMESTIC' ? 'Domestic' : 'International'} />
                <DetailRow label="Order Stage" value={order.stage || '—'} />
                <DetailRow label="Order Status" value={order.status || '—'} />
                <DetailRow label="Invoice Status" value={order.invoice_status || '—'} />
                <DetailRow label="Total Value" value={fmtAmt(order.total_value, currency)} />
                <DetailRow label="Exchange Rate" value={order.exchange_rate ? `1 ${currency} = ₹${order.exchange_rate}` : '—'} />
                <DetailRow label="Created At" value={fmtDateTime(order.created_at)} />
              </CollapsibleSection>
              
              <CollapsibleSection title="Customer Information" defaultOpen>
                <DetailRow label="Company Name" value={customer.name} />
                <DetailRow label="GST Number" value={customer.gst || '—'} />
                <DetailRow label="Email" value={customer.email || '—'} />
                <DetailRow label="Phone" value={customer.phone || '—'} />
              </CollapsibleSection>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: 24, marginBottom: 24 }}>
              <CollapsibleSection title="Addresses">
                <div style={{ display: "grid", gap: 16 }}>
                  <AddressCard title="Billing Address" address={oa.billing_address} />
                  <AddressCard title="Shipping Address" address={oa.shipping_address} />
                </div>
              </CollapsibleSection>
              
              <CollapsibleSection title="Order Acknowledgment (OA)">
                <DetailRow label="OA Number" value={oa.number} monospace />
                <DetailRow label="OA Status" value={oa.status || '—'} />
                <DetailRow label="Total Value" value={fmtAmt(oa.total_value, oa.currency || currency)} />
                <DetailRow label="Currency" value={oa.currency || currency} />
              </CollapsibleSection>
            </div>
            
            <CollapsibleSection title="Dispatch Status Summary">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 16, marginBottom: 16 }}>
                <div style={{ textAlign: "center", padding: 12, background: "#f8fafc", borderRadius: 8 }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: "#0a9e6e" }}>{summary.backorders_by_status?.DELIVERED || 0}</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>Delivered</div>
                </div>
                <div style={{ textAlign: "center", padding: 12, background: "#f8fafc", borderRadius: 8 }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: ACCENT }}>{summary.backorders_by_status?.IN_TRANSIT || 0}</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>In Transit</div>
                </div>
                <div style={{ textAlign: "center", padding: 12, background: "#f8fafc", borderRadius: 8 }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: "#c8860a" }}>{(summary.backorders_by_status?.PENDING || 0) + (summary.backorders_by_status?.INVOICED || 0)}</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>Pending/Invoiced</div>
                </div>
                <div style={{ textAlign: "center", padding: 12, background: "#f8fafc", borderRadius: 8 }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: "#dc2626" }}>{summary.backorders_by_status?.CANCELLED || 0}</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>Cancelled</div>
                </div>
              </div>
            </CollapsibleSection>
          </div>
        )}
        
        {/* Line Items Tab */}
        {activeTab === "lineitems" && (
          <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", border: `1px solid ${BORDER}` }}>
            <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700, color: PRIMARY }}>Line Items with Dispatch Status</h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${BORDER}`, background: "#f8fafc" }}>
                    <th style={{ textAlign: "left", padding: "12px 12px", color: "#64748b", fontWeight: 600 }}>#</th>
                    <th style={{ textAlign: "left", padding: "12px 12px", color: "#64748b", fontWeight: 600 }}>Part No.</th>
                    <th style={{ textAlign: "left", padding: "12px 12px", color: "#64748b", fontWeight: 600 }}>Description</th>
                    <th style={{ textAlign: "right", padding: "12px 12px", color: "#64748b", fontWeight: 600 }}>HSN Code</th>
                    <th style={{ textAlign: "right", padding: "12px 12px", color: "#64748b", fontWeight: 600 }}>Total</th>
                    <th style={{ textAlign: "right", padding: "12px 12px", color: "#64748b", fontWeight: 600 }}>Dispatched</th>
                    <th style={{ textAlign: "right", padding: "12px 12px", color: "#64748b", fontWeight: 600 }}>Remaining</th>
                    <th style={{ textAlign: "center", padding: "12px 12px", color: "#64748b", fontWeight: 600 }}>Progress</th>
                    <th style={{ textAlign: "right", padding: "12px 12px", color: "#64748b", fontWeight: 600 }}>Unit Price</th>
                  </tr>
                </thead>
                <tbody>
                  {line_items.map((item, idx) => {
                    const percent = (item.dispatched_quantity / item.total_quantity * 100) || 0
                    return (
                      <tr key={idx} style={{ borderBottom: `1px solid ${BORDER}` }}>
                        <td style={{ padding: "12px 12px", color: "#64748b" }}>{idx + 1}</td>
                        <td style={{ padding: "12px 12px", fontFamily: "monospace" }}>{item.part_no || '—'}</td>
                        <td style={{ padding: "12px 12px", fontWeight: 500 }}>{item.description}</td>
                        <td style={{ padding: "12px 12px", textAlign: "right", fontFamily: "monospace" }}>{item.hsn_code || '—'}</td>
                        <td style={{ padding: "12px 12px", textAlign: "right", fontWeight: 600 }}>{item.total_quantity} {item.unit}</td>
                        <td style={{ padding: "12px 12px", textAlign: "right", color: "#0a9e6e", fontWeight: 600 }}>{item.dispatched_quantity} {item.unit}</td>
                        <td style={{ padding: "12px 12px", textAlign: "right", color: "#c8860a", fontWeight: 600 }}>{item.remaining_quantity} {item.unit}</td>
                        <td style={{ padding: "12px 12px", textAlign: "center" }}>
                          <div style={{ width: 80, display: "inline-block" }}>
                            <div style={{ height: 4, background: "#e2e8f0", borderRadius: 2, overflow: "hidden" }}>
                              <div style={{ width: `${percent}%`, height: "100%", background: PRIMARY, borderRadius: 2 }} />
                            </div>
                            <span style={{ fontSize: 10, color: "#64748b" }}>{Math.round(percent)}%</span>
                          </div>
                        </td>
                        <td style={{ padding: "12px 12px", textAlign: "right" }}>{fmtAmt(item.unit_price, currency)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Dispatch History per line item */}
            <h4 style={{ margin: "32px 0 16px", fontSize: 14, fontWeight: 600, color: PRIMARY }}>Dispatch History by Line Item</h4>
            {line_items.map((item, idx) => (
              item.dispatches && item.dispatches.length > 0 && (
                <CollapsibleSection key={idx} title={`${item.description || item.part_no || `Line Item ${idx+1}`}`} badge={`${item.dispatched_quantity}/${item.total_quantity} units`}>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                          <th style={{ textAlign: "left", padding: "8px", color: "#64748b" }}>Back Order</th>
                          <th style={{ textAlign: "right", padding: "8px", color: "#64748b" }}>Quantity</th>
                          <th style={{ textAlign: "left", padding: "8px", color: "#64748b" }}>Status</th>
                          <th style={{ textAlign: "left", padding: "8px", color: "#64748b" }}>Invoice</th>
                          <th style={{ textAlign: "left", padding: "8px", color: "#64748b" }}>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {item.dispatches.map((dispatch, dIdx) => (
                          <tr key={dIdx} style={{ borderBottom: `1px solid ${BORDER}` }}>
                            <td style={{ padding: "8px", fontFamily: "monospace" }}>{dispatch.back_order_number}</td>
                            <td style={{ padding: "8px", textAlign: "right", fontWeight: 600 }}>{dispatch.quantity}</td>
                            <td style={{ padding: "8px" }}><StatusBadge status={dispatch.status} type="dispatch" /></td>
                            <td style={{ padding: "8px", fontFamily: "monospace" }}>{dispatch.invoice_number || '—'}</td>
                            <td style={{ padding: "8px" }}>{fmtDate(dispatch.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CollapsibleSection>
              )
            ))}
          </div>
        )}
        
        {/* Dispatch Timeline Tab */}
        {activeTab === "dispatches" && (
          <div style={{ background: "#fff", borderRadius: 12, padding: "24px", border: `1px solid ${BORDER}` }}>
            <h3 style={{ margin: "0 0 24px", fontSize: 16, fontWeight: 700, color: PRIMARY }}>
              Complete Dispatch Timeline
              <span style={{ marginLeft: 12, fontSize: 13, fontWeight: 400, color: "#64748b" }}>
                ({backorders.length} dispatches)
              </span>
            </h3>
            {backorders.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>
                No dispatches created for this order yet
              </div>
            ) : (
              backorders.map(backorder => (
                <BackOrderCard 
                  key={backorder.id} 
                  backorder={backorder} 
                  onViewInvoice={handleViewInvoice}
                  orderCurrency={currency}
                />
              ))
            )}
          </div>
        )}
        
        {/* Documents Tab */}
        {activeTab === "documents" && (
          <div style={{ background: "#fff", borderRadius: 12, padding: "24px", border: `1px solid ${BORDER}` }}>
            <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700, color: PRIMARY }}>Documents</h3>
            
            {backorders.filter(bo => bo.invoice).length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>
                No invoices generated yet
              </div>
            ) : (
              backorders.map(backorder => (
                backorder.invoice && (
                  <div key={backorder.id} style={{
                    border: `1px solid ${BORDER}`,
                    borderRadius: 10,
                    marginBottom: 16,
                    padding: 16,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                      <div>
                        <div style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 600, color: PRIMARY }}>
                          {backorder.invoice.number}
                        </div>
                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                          Back Order: {backorder.number}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 12 }}>
                        <StatusBadge status={backorder.invoice.status} type="invoice" />
                        <button
                          onClick={() => handleViewInvoice(backorder.invoice.id)}
                          style={{
                            padding: "6px 14px",
                            background: PRIMARY,
                            color: "#fff",
                            border: "none",
                            borderRadius: 6,
                            fontSize: 12,
                            cursor: "pointer",
                          }}
                        >
                          View Invoice
                        </button>
                      </div>
                    </div>
                    
                    <div style={{ marginTop: 14, display: "flex", gap: 16, fontSize: 12, color: "#64748b", flexWrap: "wrap" }}>
                      <span>📅 {fmtDate(backorder.invoice.date)}</span>
                      {backorder.invoice.transporter && <span>🚚 {backorder.invoice.transporter}</span>}
                      {backorder.invoice.vehicle_number && <span>🚛 {backorder.invoice.vehicle_number}</span>}
                      {backorder.invoice.lr_number && <span>📄 LR: {backorder.invoice.lr_number}</span>}
                    </div>
                    
                    {backorder.packaging_slip && (
                      <div style={{ marginTop: 12, padding: 12, background: "#f8fafc", borderRadius: 8, fontSize: 12 }}>
                        <strong>Packaging Slip:</strong> {backorder.packaging_slip.packing_list_number} • {backorder.packaging_slip.no_of_packages} packages
                      </div>
                    )}
                    
                    {backorder.delivery_challan && (
                      <div style={{ marginTop: 8, padding: 12, background: "#f8fafc", borderRadius: 8, fontSize: 12 }}>
                        <strong>Delivery Challan:</strong> {backorder.delivery_challan.challan_number} • {fmtDate(backorder.delivery_challan.challan_date)}
                      </div>
                    )}
                  </div>
                )
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}