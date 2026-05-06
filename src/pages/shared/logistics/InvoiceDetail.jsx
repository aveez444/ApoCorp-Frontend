// pages/shared/logistics/InvoiceDetail.jsx
import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../../api/axios'
import EditInvoiceModal from '../../../components/EditInvoiceModal'  // ← Import the enhanced modal

const PRIMARY = '#122C41'
const BORDER  = '#e2e8f0'
const FONT    = "'Inter', 'Segoe UI', sans-serif"
const fmtAmt  = n => `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n ?? 0)}`

function fmtDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}
function fmtDateTime(str) {
  if (!str) return '—'
  return new Date(str).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ── Tiny SVG icon ──────────────────────────────────────────────────────────────
const Icon = ({ d, size = 15, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)
const ic = {
  back:     'M19 12H5M12 19l-7-7 7-7',
  edit:     'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z',
  confirm:  'M20 6L9 17l-5-5',
  cancel:   'M18 6L6 18M6 6l12 12',
  print:    'M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z',
  info:     'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zM12 8v4M12 16h.01',
  invoice:  'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6',
  truck:    'M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM18.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
  pkg:      'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z',
  package:  'M4 4h16v16H4zM9 9h6M9 13h6M9 17h4',
  box:      'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5', // ← ADD THIS for E-Way Bill
}

// ── Status Badge ───────────────────────────────────────────────────────────────
const STATUS_MAP = {
  DRAFT:     { bg: '#fffbe6', color: '#c8860a', dot: '#f0a500', label: 'Draft' },
  CONFIRMED: { bg: '#e6fff5', color: '#0a9e6e', dot: '#0fc878', label: 'Confirmed' },
  CANCELLED: { bg: '#fef2f2', color: '#dc2626', dot: '#ef4444', label: 'Cancelled' },
}

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || { bg: '#f1f5f9', color: '#475569', dot: '#94a3b8', label: status || '—' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: s.bg, color: s.color,
      padding: '5px 14px', borderRadius: 99, fontSize: 12, fontWeight: 700
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.dot }} />
      {s.label}
    </span>
  )
}

// ── Info row ───────────────────────────────────────────────────────────────────
function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 10, fontSize: 13 }}>
      <span style={{ color: '#6b7280', fontWeight: 500, minWidth: 170, flexShrink: 0 }}>{label}</span>
      <span style={{ color: '#111827', fontWeight: 600 }}>{value || '—'}</span>
    </div>
  )
}

function SectionCard({ title, icon, children }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 12, padding: '20px 24px',
      border: `1px solid ${BORDER}`, boxShadow: '0 1px 6px rgba(0,0,0,.04)'
    }}>
      <div style={{
        fontSize: 13, fontWeight: 700, color: PRIMARY,
        marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${BORDER}`,
        display: 'flex', alignItems: 'center', gap: 8
      }}>
        {icon && <Icon d={icon} color={PRIMARY} />}
        {title}
      </div>
      {children}
    </div>
  )
}


// ── Cancel Confirm Modal ───────────────────────────────────────────────────────

function CancelInvoiceModal({ invoice, onClose, onDone }) {
  const [saving, setSaving] = useState(false)

  const handleCancel = async () => {
    setSaving(true)
    try {
      await api.post(`/logistics/invoices/${invoice.id}/cancel/`)
      onDone()
      onClose()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to cancel invoice.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001, backdropFilter: 'blur(4px)', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 16, maxWidth: 420, width: '100%', padding: 32, boxShadow: '0 25px 60px rgba(0,0,0,.2)', fontFamily: FONT }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Icon d={ic.cancel} size={22} color="#dc2626" />
        </div>
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#111827', marginBottom: 6 }}>Cancel Invoice?</div>
          <div style={{ fontSize: 13, color: '#6b7280' }}>
            Cancel <strong>{invoice.invoice_number}</strong>? This will revert the back order to PENDING status.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px 0', borderRadius: 9, border: `1px solid ${BORDER}`, background: '#fff', color: '#4b5563', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>
            Keep Invoice
          </button>
          <button onClick={handleCancel} disabled={saving} style={{ flex: 1, padding: '11px 0', borderRadius: 9, border: 'none', background: '#dc2626', color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? .7 : 1, fontFamily: FONT }}>
            {saving ? 'Cancelling…' : 'Yes, Cancel'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Packaging Slip Card (for viewing) ──────────────────────────────────────────

function PackagingSlipCard({ packagingSlip }) {
  if (!packagingSlip) return null
  
  return (
    <SectionCard title="Packaging Slip" icon={ic.package}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <InfoRow label="Packing List No." value={packagingSlip.packing_list_number} />
        <InfoRow label="No. of Packages" value={packagingSlip.no_of_packages} />
        <InfoRow label="Consignee Name" value={packagingSlip.consignee_name} />
        <InfoRow label="Consignee Address" value={packagingSlip.consignee_address} />
      </div>
      
      {packagingSlip.items && packagingSlip.items.length > 0 && (
        <div style={{ overflowX: 'auto', borderRadius: 8, border: `1px solid ${BORDER}`, marginTop: 12 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '10px 12px', textAlign: 'left' }}>#</th>
                <th style={{ padding: '10px 12px', textAlign: 'left' }}>Unit</th>
                <th style={{ padding: '10px 12px', textAlign: 'left' }}>Packaging Type</th>
                <th style={{ padding: '10px 12px', textAlign: 'left' }}>Case No.</th>
                <th style={{ padding: '10px 12px', textAlign: 'left' }}>Dimension</th>
                <th style={{ padding: '10px 12px', textAlign: 'left' }}>Net/Gross Wt.</th>
                <th style={{ padding: '10px 12px', textAlign: 'left' }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {packagingSlip.items.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <td style={{ padding: '10px 12px' }}>{item.serial_number || idx + 1}</td>
                  <td style={{ padding: '10px 12px' }}>{item.unit || '—'}</td>
                  <td style={{ padding: '10px 12px' }}>{item.packaging_type || '—'}</td>
                  <td style={{ padding: '10px 12px' }}>{item.packaging_case_no || '—'}</td>
                  <td style={{ padding: '10px 12px' }}>{item.packaging_dimension || '—'} {item.dimension_metric}</td>
                  <td style={{ padding: '10px 12px' }}>{item.net_weight && `${item.net_weight} / `}{item.gross_weight || '—'}</td>
                  <td style={{ padding: '10px 12px' }}>{item.description || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  )
}

// ── Delivery Challan Card (for viewing) ────────────────────────────────────────

function DeliveryChallanCard({ deliveryChallan }) {
  if (!deliveryChallan) return null
  
  return (
    <SectionCard title="Delivery Challan" icon={ic.truck}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <InfoRow label="Challan Number" value={deliveryChallan.challan_number} />
        <InfoRow label="Challan Date" value={fmtDate(deliveryChallan.challan_date)} />
        <InfoRow label="Remark" value={deliveryChallan.remark} />
      </div>
    </SectionCard>
  )
}

// ── Main InvoiceDetail Page ────────────────────────────────────────────────────

export default function InvoiceDetail({ role = 'manager' }) {
  const { id } = useParams()
  const navigate = useNavigate()

  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen]     = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [toast, setToast]           = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get(`/logistics/invoices/${id}/`)
      setInvoice(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const showToast = msg => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  const handleConfirm = async () => {
    setConfirming(true)
    try {
      await api.post(`/logistics/invoices/${id}/confirm/`)
      showToast('Invoice confirmed successfully.')
      load()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to confirm invoice.')
    } finally {
      setConfirming(false)
    }
  }

  if (loading) return (
    <div style={{ fontFamily: FONT, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 12, color: '#94a3b8' }}>
      <div style={{ width: 20, height: 20, border: `2px solid ${BORDER}`, borderTopColor: PRIMARY, borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
      Loading…
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (!invoice) return (
    <div style={{ fontFamily: FONT, textAlign: 'center', padding: 60, color: '#94a3b8' }}>Invoice not found.</div>
  )

  const isDraft     = invoice.status === 'DRAFT'
  const isConfirmed = invoice.status === 'CONFIRMED'
  const isCancelled = invoice.status === 'CANCELLED'
  const lineItems   = invoice.line_items || []
  const net         = parseFloat(invoice.net_amount ?? 0)
  const tax         = parseFloat(invoice.tax_amount ?? 0)
  const grand       = parseFloat(invoice.grand_total ?? 0)

  return (
    <div style={{ fontFamily: FONT, background: '#f8fafc', minHeight: '100vh', paddingBottom: 48 }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 28, right: 28, background: '#111827', color: '#fff', padding: '12px 22px', borderRadius: 10, fontSize: 13, fontFamily: FONT, boxShadow: '0 8px 24px rgba(0,0,0,.2)', zIndex: 9999, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon d={ic.confirm} size={14} color="#4ade80" /> {toast}
          <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 16, marginLeft: 4 }}>×</button>
        </div>
      )}

      {/* Page header */}
      <div style={{ background: PRIMARY, padding: '20px 32px', boxShadow: '0 2px 10px rgba(0,0,0,.15)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => navigate(`/${role}/logistics/invoices`)} style={{ width: 36, height: 36, borderRadius: 9, border: '1.5px solid rgba(255,255,255,.3)', background: 'rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Icon d={ic.back} color="#fff" />
            </button>
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.55)', fontWeight: 600, letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: 4 }}>
                Sales Invoice
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#fff' }}>
                  {invoice.invoice_number || '(Draft)'}
                </h1>
                <StatusBadge status={invoice.status} />
              </div>
              <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.6)', marginTop: 4 }}>
                Order: {invoice.order_number} · Back Order: {invoice.back_order_number || '—'} · {invoice.customer_name}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Print — always available */}
            <button onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', background: 'rgba(255,255,255,.12)', color: '#fff', border: '1.5px solid rgba(255,255,255,.3)', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>
              <Icon d={ic.print} color="#fff" /> Print
            </button>

            {/* Edit — only for DRAFT */}
            {isDraft && (
              <button onClick={() => setEditOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', background: 'rgba(255,255,255,.12)', color: '#fff', border: '1.5px solid rgba(255,255,255,.3)', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>
                <Icon d={ic.edit} color="#fff" /> Edit
              </button>
            )}

            {/* Cancel — DRAFT or CONFIRMED (manager) */}
            {!isCancelled && (
              <button onClick={() => setCancelOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', background: 'rgba(255,255,255,.08)', color: '#fca5a5', border: '1.5px solid rgba(252,165,165,.4)', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>
                <Icon d={ic.cancel} color="#fca5a5" /> Cancel
              </button>
            )}

            {/* Confirm — only for DRAFT */}
            {isDraft && (
              <button onClick={handleConfirm} disabled={confirming} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 22px', background: '#0a9e6e', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: confirming ? 'not-allowed' : 'pointer', opacity: confirming ? .7 : 1, fontFamily: FONT, boxShadow: '0 2px 10px rgba(10,158,110,.3)' }}>
                <Icon d={ic.confirm} color="#fff" /> {confirming ? 'Confirming…' : 'Confirm Invoice'}
              </button>
            )}

            {/* Confirmed indicator */}
            {isConfirmed && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', background: '#0a9e6e', color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 700, fontFamily: FONT }}>
                <Icon d={ic.confirm} color="#fff" /> Confirmed
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cancelled banner */}
      {isCancelled && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '12px 32px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon d={ic.info} color="#dc2626" />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#991b1b' }}>This invoice has been cancelled.</span>
        </div>
      )}

      {/* Confirmed banner */}
      {isConfirmed && (
        <div style={{ background: '#e6fff5', border: '1px solid #a7f3d0', padding: '12px 32px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon d={ic.confirm} color="#0a9e6e" />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#065f46' }}>Invoice confirmed. Editing is locked.</span>
        </div>
      )}

      {/* Body */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 18, animation: 'fadeUp .3s ease' }}>

        {/* ── Row 1: Invoice Info + Order Info ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          <SectionCard title="Invoice Details" icon={ic.invoice}>
            <InfoRow label="Invoice Number"  value={invoice.invoice_number} />
            <InfoRow label="Invoice Date"    value={fmtDate(invoice.invoice_date)} />
            <InfoRow label="PO Number"       value={invoice.po_number} />
            <InfoRow label="PO Date"         value={fmtDate(invoice.po_date)} />
            <InfoRow label="AMD Number"      value={invoice.amd_number} />
            <InfoRow label="AMD Date"        value={fmtDate(invoice.amd_date)} />
            <InfoRow label="Location"        value={invoice.location} />
            <InfoRow label="Invoice Type"    value={invoice.invoice_type} />
            <InfoRow label="Created At"      value={fmtDateTime(invoice.created_at)} />
            <InfoRow label="Last Updated"    value={fmtDateTime(invoice.updated_at)} />
          </SectionCard>

          <SectionCard title="Order & Customer" icon={ic.pkg}>
            <InfoRow label="Customer"         value={invoice.customer_name} />
            <InfoRow label="Order Number"     value={invoice.order_number} />
            <InfoRow label="OA Number"        value={invoice.oa_number} />
            <InfoRow label="Quotation No."    value={invoice.quotation_number} />
            <InfoRow label="Back Order"       value={invoice.back_order_number} />
            <InfoRow label="Order Category"   value={invoice.order_category === 'DOMESTIC' ? 'Domestic' : invoice.order_category === 'INTERNATIONAL' ? 'Export / International' : invoice.order_category} />
            <InfoRow label="Customer GST"     value={invoice.customer_gst} />
            <InfoRow label="Consignor GST"    value={invoice.consignor_gst} />
            <InfoRow label="Consignee GST"    value={invoice.consignee_gst} />
            <InfoRow label="State Code"       value={invoice.state_code} />
          </SectionCard>
        </div>

        {/* ── Row 2: Bill To / Ship To ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          <SectionCard title="Bill To">
            {invoice.bill_to ? (
              <>
                <InfoRow label="Entity"   value={invoice.bill_to.entity_name} />
                <InfoRow label="Address"  value={invoice.bill_to.address_line} />
                {invoice.bill_to.city  && <InfoRow label="City"  value={invoice.bill_to.city} />}
                {invoice.bill_to.state && <InfoRow label="State" value={invoice.bill_to.state} />}
                {invoice.bill_to.pincode && <InfoRow label="Pincode" value={invoice.bill_to.pincode} />}
              </>
            ) : <div style={{ color: '#94a3b8', fontSize: 13 }}>No billing address.</div>}
          </SectionCard>

          <SectionCard title="Ship To">
            {invoice.ship_to ? (
              <>
                <InfoRow label="Entity"   value={invoice.ship_to.entity_name} />
                <InfoRow label="Address"  value={invoice.ship_to.address_line} />
                {invoice.ship_to.city  && <InfoRow label="City"  value={invoice.ship_to.city} />}
                {invoice.ship_to.state && <InfoRow label="State" value={invoice.ship_to.state} />}
                {invoice.ship_to.pincode && <InfoRow label="Pincode" value={invoice.ship_to.pincode} />}
              </>
            ) : <div style={{ color: '#94a3b8', fontSize: 13 }}>No shipping address.</div>}
          </SectionCard>
        </div>

        {/* ── Row 3: Contact + Logistics ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          <SectionCard title="Contact Person">
            <InfoRow label="Name"   value={invoice.contact_name} />
            <InfoRow label="Phone"  value={invoice.contact_number} />
            <InfoRow label="Email"  value={invoice.contact_email} />
          </SectionCard>

          <SectionCard title="Logistics Details" icon={ic.truck}>
            <InfoRow label="Mode of Transport"  value={invoice.mode_of_transport} />
            <InfoRow label="Transporter"        value={invoice.transporter} />
            <InfoRow label="Vehicle Number"     value={invoice.vehicle_number} />
            <InfoRow label="LR Number"          value={invoice.lr_number} />
            <InfoRow label="Date of Removal"    value={fmtDate(invoice.date_of_removal)} />
            <InfoRow label="Time of Removal"    value={invoice.time_of_removal || '—'} />
            <InfoRow label="Payment Due Date"   value={fmtDate(invoice.payment_due_date)} />
          </SectionCard>
        </div>

        {/* ── Packaging Slip Section ── */}
        {invoice.packaging_slip && <PackagingSlipCard packagingSlip={invoice.packaging_slip} />}

        {/* ── Delivery Challan Section ── */}
        {invoice.delivery_challan && <DeliveryChallanCard deliveryChallan={invoice.delivery_challan} />}

        {/* ── Line Items ── */}
        <SectionCard title="Invoice Line Items">
          <div style={{ overflowX: 'auto', borderRadius: 10, border: `1px solid ${BORDER}` }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  {['#', 'Description', 'Part No.', 'HSN', 'Qty', 'Unit', 'Unit Price', 'Tax %', 'Tax Amt', 'Total'].map(h => (
                    <th key={h} style={{
                      background: PRIMARY, color: '#e2e8f0',
                      padding: '11px 13px', fontSize: 11, fontWeight: 700,
                      textAlign: ['Qty', 'Unit Price', 'Tax %', 'Tax Amt', 'Total'].includes(h) ? 'right' : 'left',
                      whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '.04em'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lineItems.length === 0 ? (
                  <tr><td colSpan={10} style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>No line items.</td></tr>
                ) : lineItems.map((li, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ padding: '11px 13px', color: '#64748b', fontWeight: 600 }}>{idx + 1}</td>
                    <td style={{ padding: '11px 13px', maxWidth: 220 }}>
                      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                        {li.description || li.product_description || '—'}
                      </span>
                    </td>
                    <td style={{ padding: '11px 13px', fontFamily: 'monospace', fontSize: 12, color: '#475569' }}>{li.part_no || li.part_number || '—'}</td>
                    <td style={{ padding: '11px 13px', color: '#64748b' }}>{li.hsn_code || '—'}</td>
                    <td style={{ padding: '11px 13px', textAlign: 'right', fontWeight: 700, color: PRIMARY }}>{li.quantity}</td>
                    <td style={{ padding: '11px 13px', color: '#64748b' }}>{li.unit || '—'}</td>
                    <td style={{ padding: '11px 13px', textAlign: 'right' }}>{fmtAmt(li.unit_price)}</td>
                    <td style={{ padding: '11px 13px', textAlign: 'right', color: '#64748b' }}>{li.tax_percent}%</td>
                    <td style={{ padding: '11px 13px', textAlign: 'right', color: '#64748b' }}>{fmtAmt(li.tax_amount)}</td>
                    <td style={{ padding: '11px 13px', textAlign: 'right', fontWeight: 700, color: PRIMARY }}>{fmtAmt(li.total)}</td>
                  </tr>
                ))}
              </tbody>
              {lineItems.length > 0 && (
                <tfoot>
                  <tr style={{ background: '#f8fafc' }}>
                    <td colSpan={8} style={{ padding: '11px 13px', textAlign: 'right', fontSize: 12, color: '#64748b', fontWeight: 600 }}>Net Amount</td>
                    <td colSpan={2} style={{ padding: '11px 13px', fontWeight: 700, color: '#1e293b' }}>{fmtAmt(net)}</td>
                  </tr>
                  <tr style={{ background: '#f8fafc' }}>
                    <td colSpan={8} style={{ padding: '11px 13px', textAlign: 'right', fontSize: 12, color: '#64748b', fontWeight: 600 }}>Tax Amount</td>
                    <td colSpan={2} style={{ padding: '11px 13px', fontWeight: 700, color: '#64748b' }}>{fmtAmt(tax)}</td>
                  </tr>
                  <tr style={{ background: PRIMARY }}>
                    <td colSpan={8} style={{ padding: '13px 13px', textAlign: 'right', fontSize: 13, color: '#fff', fontWeight: 700 }}>Grand Total</td>
                    <td colSpan={2} style={{ padding: '13px 13px', fontWeight: 700, color: '#fff', fontSize: 15 }}>{fmtAmt(grand)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </SectionCard>

                {/* ── PACKAGING SLIP SECTION ── */}
        {invoice.packaging_slip && (
          <SectionCard title="📦 Packaging Slip">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <InfoRow label="Packing List No." value={invoice.packaging_slip.packing_list_number} />
              <InfoRow label="No. of Packages" value={invoice.packaging_slip.no_of_packages} />
              <InfoRow label="Consignee Name" value={invoice.packaging_slip.consignee_name || '—'} />
              <InfoRow label="Consignee Address" value={invoice.packaging_slip.consignee_address || '—'} />
            </div>
            
            {invoice.packaging_slip.items && invoice.packaging_slip.items.length > 0 && (
              <div style={{ overflowX: 'auto', borderRadius: 8, border: `1px solid ${BORDER}`, marginTop: 12 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={{ padding: '10px 12px', textAlign: 'left' }}>#</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left' }}>Unit</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left' }}>Packaging Type</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left' }}>Case No.</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left' }}>Dimension</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left' }}>Net / Gross Wt.</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left' }}>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.packaging_slip.items.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: `1px solid ${BORDER}` }}>
                        <td style={{ padding: '10px 12px' }}>{item.serial_number || idx + 1}</td>
                        <td style={{ padding: '10px 12px' }}>{item.unit || '—'}</td>
                        <td style={{ padding: '10px 12px' }}>{item.packaging_type || '—'}</td>
                        <td style={{ padding: '10px 12px' }}>{item.packaging_case_no || '—'}</td>
                        <td style={{ padding: '10px 12px' }}>{item.packaging_dimension || '—'} {item.dimension_metric}</td>
                        <td style={{ padding: '10px 12px' }}>
                          {item.net_weight && `${item.net_weight}`}
                          {item.net_weight && item.gross_weight && ' / '}
                          {item.gross_weight && `${item.gross_weight}`}
                          {!item.net_weight && !item.gross_weight && '—'}
                        </td>
                        <td style={{ padding: '10px 12px' }}>{item.description || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        )}

        {/* ── DELIVERY CHALLAN SECTION ── */}
        {invoice.delivery_challan && (
          <SectionCard title="📋 Delivery Challan">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <InfoRow label="Challan Number" value={invoice.delivery_challan.challan_number} />
              <InfoRow label="Challan Date" value={fmtDate(invoice.delivery_challan.challan_date)} />
              <InfoRow label="Remark" value={invoice.delivery_challan.remark || '—'} />
            </div>
          </SectionCard>
        )}

        {/* ── E-WAY BILL SECTION (placeholder) ── */}
        <SectionCard title="🚚 E-Way Bill">
          <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
            <div style={{ fontSize: 12 }}>E-Way bill generation coming soon.</div>
          </div>
        </SectionCard>

        {/* ── Back order link ── */}
        {invoice.back_order && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', borderRadius: 12, padding: '16px 24px', border: `1px solid ${BORDER}` }}>
            <div style={{ fontSize: 13, color: '#374151' }}>
              <span style={{ fontWeight: 600 }}>Linked Dispatch:</span>{' '}
              <span style={{ fontFamily: 'monospace', fontWeight: 700, color: PRIMARY }}>{invoice.back_order_number}</span>
            </div>
            <button
              onClick={() => navigate(`/${role}/logistics/back-orders/${invoice.back_order}`)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', background: '#fff', color: PRIMARY, border: `1.5px solid ${PRIMARY}`, borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}
            >
              View Dispatch →
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {editOpen && (
        <EditInvoiceModal
          invoice={invoice}
          onClose={() => setEditOpen(false)}
          onSaved={() => { load(); showToast('Invoice updated successfully.') }}
          role={role}
        />
      )}
      {cancelOpen && (
        <CancelInvoiceModal
          invoice={invoice}
          onClose={() => setCancelOpen(false)}
          onDone={() => { load(); showToast('Invoice cancelled.') }}
        />
      )}
    </div>
  )
}