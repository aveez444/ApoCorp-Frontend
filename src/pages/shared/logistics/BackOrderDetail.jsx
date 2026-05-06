// pages/shared/logistics/BackOrderDetail.jsx
import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../../api/axios'

const PRIMARY = '#122C41'
const ACCENT  = '#1e88e5'
const BORDER  = '#d1d5db'
const FONT    = "'Inter', 'Segoe UI', sans-serif"
const LABEL   = '#6b7280'
const TEXT    = '#1a1a2e'

// ── Icon helper ─────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)
const ic = {
  arrowLeft:    'M19 12H5M12 19l-7-7 7-7',
  invoice:      'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6',
  package:      'M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12',
  user:         'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  pin:          'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6',
  calendar:     'M3 4h18v18H3zM16 2v4M8 2v4M3 10h18',
  cancel:       'M18 6L6 18M6 6l12 12',
  check:        'M20 6L9 17l-5-5',
  truck:        'M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM18.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
  info:         'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zM12 8v4M12 16h.01',
}

// ── Status configs ──────────────────────────────────────────────────────────────
const BO_STATUS = {
  PENDING:    { bg: '#fffbe6', color: '#c8860a', dot: '#f0a500', label: 'Pending' },
  INVOICED:   { bg: '#e6f0ff', color: '#1a7fd4', dot: '#1a7fd4', label: 'Invoiced' },
  IN_TRANSIT: { bg: '#e6f0ff', color: '#1a7fd4', dot: '#1a7fd4', label: 'In Transit' },
  DELIVERED:  { bg: '#e6fff5', color: '#0a9e6e', dot: '#0fc878', label: 'Delivered' },
  CANCELLED:  { bg: '#fef2f2', color: '#dc2626', dot: '#ef4444', label: 'Cancelled' },
}

const INVOICE_STATUS = {
  NOT_INVOICED:       { bg: '#fffbe6', color: '#c8860a', dot: '#f0a500', label: 'Not Invoiced' },
  PARTIALLY_INVOICED: { bg: '#e6f0ff', color: '#1a7fd4', dot: '#1a7fd4', label: 'Partially Invoiced' },
  FULLY_INVOICED:     { bg: '#e6fff5', color: '#0a9e6e', dot: '#0fc878', label: 'Fully Invoiced' },
}

// ── Shared UI pieces ────────────────────────────────────────────────────────────
function StatusBadge({ status, map }) {
  const s = map[status] || { bg: '#f1f5f9', color: '#475569', dot: '#94a3b8', label: status || '—' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: s.bg, color: s.color,
      fontSize: 12, fontWeight: 700, fontFamily: FONT,
      padding: '5px 12px', borderRadius: 99,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      {s.label}
    </span>
  )
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 10, fontSize: 13.5, fontFamily: FONT }}>
      <span style={{ color: LABEL, fontWeight: 500, minWidth: 180, flexShrink: 0 }}>{label} :</span>
      <span style={{ color: '#111827', fontWeight: 600 }}>{value || '—'}</span>
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <div style={{
      fontSize: 14, fontWeight: 700, color: PRIMARY, fontFamily: FONT,
      marginBottom: 16, paddingBottom: 10, borderBottom: '1.5px solid #eef0f4',
    }}>
      {children}
    </div>
  )
}

const card = {
  background: '#fff', borderRadius: 12, padding: '22px 26px',
  boxShadow: '0 1px 8px rgba(0,0,0,.06)', border: `1px solid #eef0f4`,
}

function fmtDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtDateTime(str) {
  if (!str) return '—'
  return new Date(str).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const fmtAmt = n =>
  `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n ?? 0)}`

const fmt = n => new Intl.NumberFormat('en-IN').format(n ?? 0)

// Helper to calculate line item tax and total from BackOrder data
function calculateLineItemTotals(item) {
  const qty = parseFloat(item.quantity_dispatching || item.quantity || 0)
  const unitPrice = parseFloat(item.unit_price || 0)
  const taxPercent = parseFloat(item.tax_percent || 0)
  
  const lineExcl = qty * unitPrice
  const taxAmount = lineExcl * (taxPercent / 100)
  const total = lineExcl + taxAmount
  
  return {
    taxPercent,
    taxAmount,
    total,
    lineExcl
  }
}

// ── Cancel Confirm Modal ─────────────────────────────────────────────────────────
function CancelModal({ boNumber, onClose, onConfirm, saving }) {
  const [reason, setReason] = useState('')
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 440, padding: '32px', boxShadow: '0 25px 60px rgba(0,0,0,.2)' }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Icon d={ic.cancel} size={24} color="#dc2626" />
        </div>
        <h2 style={{ textAlign: 'center', fontSize: 18, fontWeight: 700, color: '#111827', margin: '0 0 6px', fontFamily: FONT }}>Cancel Dispatch</h2>
        <p style={{ textAlign: 'center', color: '#6b7280', fontSize: 13.5, margin: '0 0 22px', fontFamily: FONT }}>
          Cancel back order <strong>{boNumber}</strong>? This cannot be undone.
        </p>
        <div style={{ marginBottom: 22 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: LABEL, marginBottom: 6, fontFamily: FONT, textTransform: 'uppercase', letterSpacing: '.04em' }}>Reason (optional)</label>
          <textarea
            rows={3}
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Why is this dispatch being cancelled?"
            style={{ width: '100%', padding: '10px 13px', border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 13.5, fontFamily: FONT, color: TEXT, resize: 'none', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: '11px 0', borderRadius: 9, border: `1px solid ${BORDER}`, background: '#fff', color: '#4b5563', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}
          >
            Keep Dispatch
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={saving}
            style={{ flex: 1, padding: '11px 0', borderRadius: 9, border: 'none', background: '#dc2626', color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? .7 : 1, fontFamily: FONT }}
          >
            {saving ? 'Cancelling…' : 'Cancel Dispatch'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ───────────────────────────────────────────────────────────────────
export default function BackOrderDetail({ role = 'manager' }) {
  const { id } = useParams()
  const navigate = useNavigate()

  const [bo, setBo]             = useState(null)
  const [loading, setLoading]   = useState(true)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [toast, setToast]       = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get(`/logistics/back-orders/${id}/`)
      setBo(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const handleCancel = async (reason) => {
    setCancelling(true)
    try {
      await api.post(`/logistics/back-orders/${id}/cancel/`, { reason })
      setCancelOpen(false)
      setToast('Dispatch cancelled successfully.')
      load()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel dispatch')
    } finally {
      setCancelling(false)
    }
  }

  // ── Loading ──
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 340, fontFamily: FONT, color: '#94a3b8', gap: 12 }}>
        <div style={{ width: 20, height: 20, border: '2px solid #e2e8f0', borderTopColor: PRIMARY, borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
        Loading…
      </div>
    )
  }

  if (!bo) {
    return (
      <div style={{ textAlign: 'center', padding: 60, fontFamily: FONT, color: '#94a3b8' }}>
        Back order not found.
      </div>
    )
  }

  // ── Derived values ──
  const canCreateInvoice = bo.status !== 'CANCELLED' && bo.invoice_status !== 'FULLY_INVOICED'
  const isCancelled      = bo.status === 'CANCELLED'
  const isInvoiced       = bo.invoice_status === 'FULLY_INVOICED'
  const hasInvoice       = bo.invoices && bo.invoices.length > 0

  // Sub-totals from line items with proper tax calculation
  const lineItems = bo.line_items || []
  
  // Calculate totals using the correct tax data from BackOrder line items
  let totalQty = 0
  let totalTaxAmount = 0
  let totalLineValue = 0
  
  lineItems.forEach(item => {
    const qty = parseFloat(item.quantity_dispatching ?? item.quantity ?? 0)
    const unitPrice = parseFloat(item.unit_price ?? 0)
    const taxPercent = parseFloat(item.tax_percent ?? 0)
    
    totalQty += qty
    const lineExcl = qty * unitPrice
    const taxAmount = lineExcl * (taxPercent / 100)
    totalTaxAmount += taxAmount
    totalLineValue += lineExcl + taxAmount
  })

  const outlineBtn = {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '8px 18px', border: `1.5px solid ${PRIMARY}`,
    borderRadius: 8, background: '#fff', color: PRIMARY,
    fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONT,
  }

  const cancelBtn = {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '8px 18px', border: '1.5px solid #fca5a5',
    borderRadius: 8, background: '#fff', color: '#dc2626',
    fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONT,
  }

  const createInvoiceBtn = {
    display: 'flex', alignItems: 'center', gap: 7,
    padding: '9px 22px', border: 'none',
    borderRadius: 8, background: PRIMARY, color: '#fff',
    fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT,
    boxShadow: '0 2px 10px rgba(18,44,65,.25)',
  }

  return (
    <div style={{ fontFamily: FONT, color: TEXT }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
      `}</style>

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, right: 28, background: '#111827', color: '#fff',
          padding: '12px 22px', borderRadius: 10, fontSize: 13.5, fontFamily: FONT,
          boxShadow: '0 8px 24px rgba(0,0,0,.2)', zIndex: 9999, display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <Icon d={ic.check} size={15} color="#4ade80" />
          {toast}
          <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 16, marginLeft: 4 }}>×</button>
        </div>
      )}

      {/* ── Top Bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            onClick={() => navigate(`/${role}/logistics/back-orders`)}
            style={{ width: 36, height: 36, borderRadius: 9, border: '1.5px solid #e5e7eb', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <Icon d={ic.arrowLeft} color="#6b7280" />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: PRIMARY }}>{bo.back_order_number}</h1>
            <StatusBadge status={bo.status} map={BO_STATUS} />
            <StatusBadge status={bo.invoice_status} map={INVOICE_STATUS} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {/* Cancel button — only if not already cancelled/invoiced */}
          {!isCancelled && !isInvoiced && bo.status === 'PENDING' && (
            <button style={cancelBtn} onClick={() => setCancelOpen(true)}>
              <Icon d={ic.cancel} size={14} color="#dc2626" /> Cancel Dispatch
            </button>
          )}
          {/* Create Invoice CTA */}
          {canCreateInvoice && bo.status === 'PENDING' && (
            <button
              style={createInvoiceBtn}
              onClick={() => navigate(`/${role}/logistics/invoices/create?back_order_id=${bo.id}`)}
            >
              <Icon d={ic.invoice} size={14} color="#fff" />
              Create Invoice
            </button>
          )}
          {isInvoiced && (
            <button
              style={{ ...createInvoiceBtn, background: '#0a9e6e', boxShadow: 'none', cursor: 'default' }}
              disabled
            >
              <Icon d={ic.check} size={14} color="#fff" />
              Fully Invoiced
            </button>
          )}
        </div>
      </div>

      {/* ── Sub-header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, fontSize: 13.5 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#374151', fontWeight: 600 }}>
          <Icon d={ic.user} size={14} color="#6b7280" />
          {bo.entity_name || '—'}
        </div>
        <span style={{ color: '#d1d5db' }}>|</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#374151' }}>
          <Icon d={ic.pin} size={14} color="#6b7280" />
          {bo.location || bo.shipping_city || '—'}
        </div>
        <span style={{ color: '#d1d5db' }}>|</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#374151' }}>
          <Icon d={ic.calendar} size={14} color="#6b7280" />
          Created {fmtDate(bo.created_at)}
        </div>
      </div>

      {/* ── Cancelled Banner ── */}
      {isCancelled && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Icon d={ic.info} size={18} color="#dc2626" />
          <div>
            <span style={{ fontWeight: 700, color: '#991b1b', fontSize: 13.5, fontFamily: FONT }}>This dispatch has been cancelled.</span>
            {bo.cancellation_reason && (
              <span style={{ color: '#7f1d1d', fontSize: 13, fontFamily: FONT }}> Reason: {bo.cancellation_reason}</span>
            )}
          </div>
        </div>
      )}

      {/* ── Not Yet Invoiced Banner ── */}
      {!isCancelled && bo.invoice_status === 'NOT_INVOICED' && bo.status === 'PENDING' && (
        <div style={{ background: '#fffbe6', border: '1px solid #fde68a', borderRadius: 10, padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Icon d={ic.info} size={18} color="#c8860a" />
            <span style={{ fontWeight: 600, color: '#92400e', fontSize: 13.5, fontFamily: FONT }}>
              No invoice created yet for this dispatch.
            </span>
          </div>
          <button
            style={{ ...createInvoiceBtn, padding: '7px 18px', fontSize: 12.5 }}
            onClick={() => navigate(`/${role}/logistics/invoices/create?back_order_id=${bo.id}`)}
          >
            <Icon d={ic.invoice} size={13} color="#fff" /> Create Invoice Now
          </button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeUp .3s ease' }}>

        {/* ── Section 1: Dispatch Summary ── */}
        <div style={card}>
          <SectionTitle>Dispatch Summary</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0 }}>
            <InfoRow label="Back Order Number"   value={bo.back_order_number} />
            <InfoRow label="Order Number"         value={bo.order_number} />
            <InfoRow label="PO Number"            value={bo.po_number} />
            <InfoRow label="OA Number"            value={bo.oa_number} />
            <InfoRow label="Order Category"       value={bo.order_category === 'DOMESTIC' ? 'Domestic' : bo.order_category === 'INTERNATIONAL' ? 'Export / International' : bo.order_category} />
            <InfoRow label="Reason for Dispatch"  value={bo.reason} />
            <InfoRow label="Expected Dispatch Date" value={fmtDate(bo.expected_dispatch_date)} />
            <InfoRow label="Created At"           value={fmtDateTime(bo.created_at)} />
            <InfoRow label="Created By"           value={bo.created_by_name || bo.created_by} />
          </div>
        </div>

        {/* ── Section 2: Customer & Order Info ── */}
        <div style={card}>
          <SectionTitle>Customer &amp; Order Details</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0 }}>
            <InfoRow label="Entity Name"          value={bo.entity_name} />
            <InfoRow label="Enquiry Number"       value={bo.enquiry_number} />
            <InfoRow label="Quotation Number"     value={bo.quotation_number} />
            <InfoRow label="Currency"             value={bo.currency} />
            <InfoRow label="Exchange Rate"        value={bo.exchange_rate ? `1 ${bo.currency} = ₹${bo.exchange_rate}` : undefined} />
            <InfoRow label="Order Stage"          value={bo.order_stage} />
          </div>
        </div>

        {/* ── Section 3: Dispatch Progress ── */}
        <div style={card}>
          <SectionTitle>Dispatch Progress</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 4 }}>
            {[
              { label: 'Total Order Qty', value: fmt(bo.order_total_quantity), color: '#1e293b' },
              { label: 'Already Shipped', value: fmt(bo.total_shipped_before), color: '#1a7fd4' },
              { label: 'This Dispatch', value: fmt(totalQty || bo.total_dispatching_quantity), color: PRIMARY },
              { label: 'Remaining After', value: fmt(bo.remaining_after), color: bo.remaining_after > 0 ? '#c8860a' : '#0a9e6e' },
            ].map(stat => (
              <div key={stat.label} style={{ background: '#f8fafc', borderRadius: 10, padding: '16px 18px', border: `1px solid #eef0f4` }}>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6 }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, color: stat.color }}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
          {/* Progress bar */}
          {bo.order_total_quantity > 0 && (() => {
            const shipped = parseFloat(bo.total_shipped_before ?? 0)
            const thisDispatch = parseFloat(totalQty || (bo.total_dispatching_quantity ?? 0))
            const total = parseFloat(bo.order_total_quantity ?? 1)
            const shippedPct = Math.min((shipped / total) * 100, 100)
            const thisPct = Math.min((thisDispatch / total) * 100, 100 - shippedPct)
            return (
              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b', marginBottom: 6 }}>
                  <span>Dispatch completion</span>
                  <span style={{ fontWeight: 600, color: PRIMARY }}>{Math.round(shippedPct + thisPct)}%</span>
                </div>
                <div style={{ height: 8, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden', display: 'flex' }}>
                  <div style={{ width: `${shippedPct}%`, background: '#1a7fd4', transition: 'width .4s' }} />
                  <div style={{ width: `${thisPct}%`, background: PRIMARY, transition: 'width .4s' }} />
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 12, color: '#64748b' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: '#1a7fd4', display: 'inline-block' }} />
                    Previously shipped
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: PRIMARY, display: 'inline-block' }} />
                    This dispatch
                  </span>
                </div>
              </div>
            )
          })()}
        </div>

        {/* ── Section 4: Line Items ── */}
        <div style={card}>
          <SectionTitle>Items in This Dispatch</SectionTitle>
          <div style={{ overflowX: 'auto', borderRadius: 10, border: `1px solid #eef0f4` }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['#', 'Description', 'Part No.', 'HSN', 'Qty', 'Unit', 'Unit Price (₹)', 'Tax %', 'Tax Amt (₹)', 'Line Total (₹)'].map(h => (
                    <th key={h} style={{ padding: '11px 14px', textAlign: 'right', fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.04em', borderBottom: `1px solid ${BORDER}`, whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lineItems.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>No line items</td>
                  </tr>
                ) : lineItems.map((item, idx) => {
                  // Calculate tax and total from BackOrder data directly
                  const qty = parseFloat(item.quantity_dispatching ?? item.quantity ?? 0)
                  const unitPrice = parseFloat(item.unit_price ?? 0)
                  const taxPercent = parseFloat(item.tax_percent ?? 0)
                  
                  const lineExcl = qty * unitPrice
                  const taxAmount = lineExcl * (taxPercent / 100)
                  const lineTotal = lineExcl + taxAmount
                  
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ padding: '12px 14px', textAlign: 'right', color: '#64748b', fontWeight: 600 }}>{idx + 1}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', maxWidth: 220 }}>
                        <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                          {item.description || '—'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: 'monospace', color: '#475569' }}>{item.part_no || '—'}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', color: '#475569' }}>{item.hsn_code || '—'}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: PRIMARY }}>{fmt(qty)}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', color: '#64748b' }}>{item.unit || '—'}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', color: '#1e293b', fontWeight: 500 }}>{fmtAmt(unitPrice)}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', color: '#64748b', fontWeight: 500 }}>
                        {taxPercent > 0 ? `${taxPercent}%` : '—'}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', color: '#64748b' }}>
                        {taxAmount > 0 ? fmtAmt(taxAmount) : '—'}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: '#1e293b' }}>
                        {lineTotal > 0 ? fmtAmt(lineTotal) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              {lineItems.length > 0 && (
                <tfoot style={{ background: '#f8fafc' }}>
                  <tr>
                    <td colSpan={4} style={{ padding: '12px 14px', fontWeight: 700, fontSize: 13, color: '#475569', textAlign: 'right' }}>Total</td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, fontSize: 14, color: PRIMARY }}>{fmt(totalQty)}</td>
                    <td colSpan={2} />
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, fontSize: 14, color: '#1e293b' }}>{fmtAmt(totalTaxAmount)}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, fontSize: 14, color: PRIMARY }}>{fmtAmt(totalLineValue)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* ── Section 5: Invoice Status ── */}
        <div style={card}>
          <SectionTitle>Invoice Status</SectionTitle>
          {!hasInvoice ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '20px 0' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: '#fffbe6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon d={ic.invoice} size={20} color="#c8860a" />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#111827', fontFamily: FONT }}>No invoice created yet</div>
                <div style={{ fontSize: 13, color: '#6b7280', marginTop: 3, fontFamily: FONT }}>Use the "Create Invoice" button above to generate an invoice for this dispatch.</div>
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', borderRadius: 10, border: `1px solid #eef0f4` }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Invoice No.', 'Date', 'Amount', 'Status'].map(h => (
                      <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.04em', borderBottom: `1px solid ${BORDER}` }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bo.invoices.map((inv, idx) => (
                    <tr
                      key={idx}
                      style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                      onClick={() => navigate(`/${role}/logistics/invoices/${inv.id}`)}
                    >
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: PRIMARY, fontFamily: 'monospace' }}>{inv.invoice_number}</td>
                      <td style={{ padding: '12px 14px', color: '#374151' }}>{fmtDate(inv.invoice_date)}</td>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: '#1e293b' }}>{fmtAmt(inv.grand_total || inv.grand_total)}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <StatusBadge status={inv.status} map={{
                          DRAFT:     { bg: '#f1f5f9', color: '#475569', dot: '#94a3b8', label: 'Draft' },
                          CONFIRMED: { bg: '#e6fff5', color: '#0a9e6e', dot: '#0fc878', label: 'Confirmed' },
                          CANCELLED: { bg: '#fef2f2', color: '#dc2626', dot: '#ef4444', label: 'Cancelled' },
                        }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* ── Cancel Modal ── */}
      {cancelOpen && (
        <CancelModal
          boNumber={bo.back_order_number}
          onClose={() => setCancelOpen(false)}
          onConfirm={handleCancel}
          saving={cancelling}
        />
      )}
    </div>
  )
}