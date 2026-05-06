// pages/shared/logistics/LogisticsOrderDetail.jsx
import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../../api/axios'

const PRIMARY = "#122C41"
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

const fmtAmt = (n) => `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n ?? 0)}`

const STATUS_CONFIG = {
  PENDING: { bg: "#fffbe6", color: "#c8860a", dot: "#f0a500", label: "Pending Dispatch" },
  INVOICED: { bg: "#e6f0ff", color: "#1a7fd4", dot: "#1a7fd4", label: "Ready for Shipment" },
  IN_TRANSIT: { bg: "#e6fff5", color: "#0a9e6e", dot: "#0fc878", label: "In Transit" },
  OUT_FOR_DELIVERY: { bg: "#fee2e2", color: "#dc2626", dot: "#ef4444", label: "Out for Delivery" },
  DELIVERED: { bg: "#e6fff5", color: "#0a9e6e", dot: "#0fc878", label: "Delivered" },
  DELAYED: { bg: "#fef2f2", color: "#dc2626", dot: "#ef4444", label: "Delayed" },
  RETURNED: { bg: "#fef2f2", color: "#dc2626", dot: "#ef4444", label: "Returned" },
  CANCELLED: { bg: "#f1f5f9", color: "#64748b", dot: "#94a3b8", label: "Cancelled" },
  COMPLETED: { bg: "#e6fff5", color: "#0a9e6e", dot: "#0fc878", label: "Completed" },
}

function StatusBadge({ status, size = "normal" }) {
  const s = STATUS_CONFIG[status] || { bg: "#f1f5f9", color: "#64748b", dot: "#94a3b8", label: status || "Unknown" }
  const padding = size === "large" ? "6px 16px" : "4px 12px"
  const fontSize = size === "large" ? 13 : 11
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      background: s.bg,
      color: s.color,
      padding,
      borderRadius: 30,
      fontSize,
      fontWeight: 600,
      whiteSpace: "nowrap"
    }}>
      <span style={{ width: size === "large" ? 9 : 7, height: size === "large" ? 9 : 7, borderRadius: "50%", background: s.dot }} />
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

function InfoRow({ label, value, highlight }) {
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 12, fontSize: 13, alignItems: 'flex-start' }}>
      <span style={{ color: '#64748b', fontWeight: 500, minWidth: 140, flexShrink: 0 }}>{label}</span>
      <span style={{ 
        color: highlight ? PRIMARY : '#1e293b', 
        fontWeight: highlight ? 700 : 500,
        wordBreak: 'break-word',
        flex: 1
      }}>
        {value || '—'}
      </span>
    </div>
  )
}

function SectionCard({ title, icon, children }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 12,
      padding: '20px 24px',
      border: `1px solid ${BORDER}`,
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
    }}>
      <div style={{
        fontSize: 13,
        fontWeight: 700,
        color: PRIMARY,
        marginBottom: 16,
        paddingBottom: 12,
        borderBottom: `1px solid ${BORDER}`,
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }}>
        {icon && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d={icon} />
          </svg>
        )}
        {title}
      </div>
      {children}
    </div>
  )
}

const ICONS = {
  order: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  truck: 'M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM18.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
  package: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM12 22V12M3.5 7.5L12 12l8.5-4.5',
  contact: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  location: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  back: 'M19 12H5M12 19l-7-7 7-7',
}

export default function LogisticsOrderDetail({ role = 'employee' }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [backOrder, setBackOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadBackOrder = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await api.get(`/logistics/back-orders/${id}/`)
      setBackOrder(res.data)
    } catch (err) {
      console.error('Error fetching backorder detail:', err)
      setError(err.response?.data?.message || 'Failed to load shipment details')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadBackOrder()
  }, [loadBackOrder])

  if (loading) {
    return (
      <div style={{ fontFamily: FONT, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 12, color: '#94a3b8' }}>
        <div style={{ width: 24, height: 24, border: `2px solid ${BORDER}`, borderTopColor: PRIMARY, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        Loading shipment details...
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (error || !backOrder) {
    return (
      <div style={{ fontFamily: FONT, textAlign: 'center', padding: 60, color: '#64748b' }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: 16, opacity: 0.5 }}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p>{error || 'Shipment not found'}</p>
        <button onClick={() => navigate(`/${role}/logistics/order-tracking`)} style={{
          marginTop: 16,
          padding: '8px 20px',
          background: PRIMARY,
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 600
        }}>
          Back to Tracking
        </button>
      </div>
    )
  }

  const invoice = backOrder.invoices?.[0] || backOrder.invoice
  const lineItems = backOrder.line_items || []
  const totalQuantity = lineItems.reduce((sum, item) => sum + (parseFloat(item.quantity_dispatching) || 0), 0)
  const remainingAfter = backOrder.remaining_after || 0
  const shippedBefore = backOrder.total_shipped_before || 0
  const orderTotal = backOrder.order_total_quantity || 0
  const completionPercent = orderTotal > 0 ? (shippedBefore / orderTotal) * 100 : 0

  return (
    <div style={{ fontFamily: FONT, background: '#f8fafc', minHeight: '100vh', paddingBottom: 48 }}>
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }`}</style>

      {/* Header with Back Button */}
      <div style={{ background: PRIMARY, padding: '20px 32px', boxShadow: '0 2px 10px rgba(0,0,0,.15)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button 
              onClick={() => navigate(`/${role}/logistics/order-tracking`)} 
              style={{ 
                width: 36, height: 36, borderRadius: 9, 
                border: '1.5px solid rgba(255,255,255,.3)', 
                background: 'rgba(255,255,255,.1)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                cursor: 'pointer' 
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                <path d={ICONS.back} />
              </svg>
            </button>
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.55)', fontWeight: 600, letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: 4 }}>
                Shipment Tracking
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#fff', fontFamily: 'monospace' }}>
                  {backOrder.back_order_number || 'Shipment'}
                </h1>
                <StatusBadge status={backOrder.status} size="large" />
                {backOrder.tracking_status && backOrder.tracking_status !== backOrder.status && (
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,.6)' }}>
                    Tracking: {backOrder.tracking_status}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.6)', marginTop: 4 }}>
                Order: {backOrder.order_number || '—'} · PO: {backOrder.po_number || '—'}
              </div>
            </div>
          </div>
          <CategoryBadge category={backOrder.order_category} />
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 32px', animation: 'fadeUp .3s ease' }}>
        
        {/* Progress Bar */}
        {orderTotal > 0 && (
          <div style={{ background: '#fff', borderRadius: 12, padding: '16px 24px', marginBottom: 20, border: `1px solid ${BORDER}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12, color: '#64748b' }}>
              <span>Order Fulfillment Progress</span>
              <span>{Math.round(completionPercent)}% Complete</span>
            </div>
            <div style={{ height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: `${completionPercent}%`, height: '100%', background: '#0a9e6e', borderRadius: 4 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: '#94a3b8' }}>
              <span>Shipped: {shippedBefore.toFixed(2)}</span>
              <span>This Dispatch: {totalQuantity.toFixed(2)}</span>
              <span>Remaining: {remainingAfter.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Main Grid: Order Info + Logistics */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
          <SectionCard title="Order Information" icon={ICONS.order}>
            <InfoRow label="PO Number" value={backOrder.po_number} highlight />
            <InfoRow label="Customer / Entity" value={backOrder.entity_name || backOrder.customer_name} />
            <InfoRow label="Order Number" value={backOrder.order_number} />
            <InfoRow label="OA Number" value={backOrder.oa_number} />
            <InfoRow label="Order Category" value={backOrder.order_category === 'DOMESTIC' ? 'Domestic' : 'International'} />
            <InfoRow label="Currency" value={backOrder.currency} />
            <InfoRow label="Exchange Rate" value={backOrder.exchange_rate} />
            <InfoRow label="Order Stage" value={backOrder.order_stage} />
          </SectionCard>

          <SectionCard title="Logistics & Shipment" icon={ICONS.truck}>
            <InfoRow label="Transporter" value={invoice?.transporter || backOrder.transporter || '—'} />
            <InfoRow label="Mode of Transport" value={invoice?.mode_of_transport || backOrder.mode_of_transport || '—'} />
            <InfoRow label="Vehicle Number" value={invoice?.vehicle_number || backOrder.vehicle_number || '—'} />
            <InfoRow label="LR / GR Number" value={invoice?.lr_number || backOrder.lr_number || '—'} />
            <InfoRow label="Ship To Location" value={backOrder.location || backOrder.shipping_city || '—'} />
            <InfoRow label="Expected Delivery (ETD)" value={backOrder.etd ? fmtDate(backOrder.etd) : '—'} />
            <InfoRow label="Current Location" value={backOrder.current_location || '—'} />
            {backOrder.tracking_remark && (
              <InfoRow label="Tracking Remark" value={backOrder.tracking_remark} />
            )}
          </SectionCard>
        </div>

        {/* Invoice Reference */}
        {invoice && (
          <SectionCard title="Invoice Reference" icon={ICONS.package} style={{ marginBottom: 20 }}>
            <InfoRow label="Invoice Number" value={invoice.invoice_number} />
            <InfoRow label="Invoice Date" value={fmtDate(invoice.invoice_date)} />
            <InfoRow label="Invoice Status" value={invoice.status} />
            <InfoRow label="Net Amount" value={fmtAmt(invoice.net_amount)} />
            <InfoRow label="Grand Total" value={fmtAmt(invoice.grand_total)} />
            {invoice.payment_due_date && (
              <InfoRow label="Payment Due" value={fmtDate(invoice.payment_due_date)} />
            )}
            <button
              onClick={() => navigate(`/${role}/logistics/invoices/${invoice.id}`)}
              style={{
                marginTop: 16,
                padding: '8px 18px',
                background: '#fff',
                color: PRIMARY,
                border: `1.5px solid ${PRIMARY}`,
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: FONT
              }}
            >
              View Full Invoice →
            </button>
          </SectionCard>
        )}

        {/* Contact Information */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
          <SectionCard title="Contact Person" icon={ICONS.contact}>
            <InfoRow label="Name" value={invoice?.contact_name || backOrder.contact_name || '—'} />
            <InfoRow label="Phone" value={invoice?.contact_number || backOrder.contact_number || '—'} />
            <InfoRow label="Email" value={invoice?.contact_email || backOrder.contact_email || '—'} />
          </SectionCard>

          <SectionCard title="Address Information" icon={ICONS.location}>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>Bill To</div>
              <div style={{ fontSize: 13, color: '#1e293b', lineHeight: 1.5 }}>
                {invoice?.bill_to?.entity_name && <div>{invoice.bill_to.entity_name}</div>}
                {invoice?.bill_to?.address_line && <div>{invoice.bill_to.address_line}</div>}
                {invoice?.bill_to?.city && invoice?.bill_to?.state && (
                  <div>{invoice.bill_to.city}, {invoice.bill_to.state}</div>
                )}
                {!invoice?.bill_to?.entity_name && !invoice?.bill_to?.address_line && <span>—</span>}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>Ship To</div>
              <div style={{ fontSize: 13, color: '#1e293b', lineHeight: 1.5 }}>
                {invoice?.ship_to?.entity_name && <div>{invoice.ship_to.entity_name}</div>}
                {invoice?.ship_to?.address_line && <div>{invoice.ship_to.address_line}</div>}
                {invoice?.ship_to?.city && invoice?.ship_to?.state && (
                  <div>{invoice.ship_to.city}, {invoice.ship_to.state}</div>
                )}
                {!invoice?.ship_to?.entity_name && !invoice?.ship_to?.address_line && <span>—</span>}
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Line Items */}
        <SectionCard title="Dispatched Items" icon={ICONS.package}>
          <div style={{ overflowX: 'auto', borderRadius: 10, border: `1px solid ${BORDER}` }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
        <tr>
                  <th style={{ background: PRIMARY, color: '#e2e8f0', padding: '11px 13px', fontSize: 11, fontWeight: 700, textAlign: 'left' }}>#</th>
                  <th style={{ background: PRIMARY, color: '#e2e8f0', padding: '11px 13px', fontSize: 11, fontWeight: 700, textAlign: 'left' }}>Description</th>
                  <th style={{ background: PRIMARY, color: '#e2e8f0', padding: '11px 13px', fontSize: 11, fontWeight: 700, textAlign: 'left' }}>Part No.</th>
                  <th style={{ background: PRIMARY, color: '#e2e8f0', padding: '11px 13px', fontSize: 11, fontWeight: 700, textAlign: 'center' }}>Qty</th>
                  <th style={{ background: PRIMARY, color: '#e2e8f0', padding: '11px 13px', fontSize: 11, fontWeight: 700, textAlign: 'right' }}>Unit Price</th>
                  <th style={{ background: PRIMARY, color: '#e2e8f0', padding: '11px 13px', fontSize: 11, fontWeight: 700, textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>No items in this dispatch</td></tr>
                ) : (
                  lineItems.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '11px 13px', color: '#64748b', fontWeight: 600 }}>{idx + 1}</td>
                      <td style={{ padding: '11px 13px', fontWeight: 500 }}>{item.description || item.line_item_description || '—'}</td>
                      <td style={{ padding: '11px 13px', fontFamily: 'monospace', fontSize: 12, color: '#475569' }}>{item.part_no || '—'}</td>
                      <td style={{ padding: '11px 13px', textAlign: 'center', fontWeight: 700, color: PRIMARY }}>{item.quantity_dispatching}</td>
                      <td style={{ padding: '11px 13px', textAlign: 'right' }}>{fmtAmt(item.unit_price)}</td>
                      <td style={{ padding: '11px 13px', textAlign: 'right', fontWeight: 600, color: PRIMARY }}>{fmtAmt(item.unit_price * item.quantity_dispatching)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* Timeline / Remarks Section */}
        {backOrder.created_at && (
          <div style={{ 
            background: '#f8fafc', 
            borderRadius: 12, 
            padding: '16px 20px', 
            marginTop: 20,
            border: `1px solid ${BORDER}`,
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16
          }}>
            <div>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Dispatch Created</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#1e293b' }}>{fmtDateTime(backOrder.created_at)}</div>
            </div>
            {backOrder.expected_dispatch_date && (
              <div>
                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Expected Dispatch Date</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#1e293b' }}>{fmtDate(backOrder.expected_dispatch_date)}</div>
              </div>
            )}
            {backOrder.updated_at && backOrder.updated_at !== backOrder.created_at && (
              <div>
                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Last Updated</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#1e293b' }}>{fmtDateTime(backOrder.updated_at)}</div>
              </div>
            )}
            {backOrder.reason && (
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Remarks / Reason</div>
                <div style={{ fontSize: 13, color: '#1e293b' }}>{backOrder.reason}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}