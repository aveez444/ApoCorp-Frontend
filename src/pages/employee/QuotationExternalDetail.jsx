// apps/frontend/src/pages/employee/quotations/QuotationExternalDetail.jsx

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import Toast from '../../components/Toast'
import EditQuoteModal from '../../components/modals/EditQuoteModal'
import QuotationPDFPanel from '../../components/QuotationPDFPanel'

// ─── Status maps ──────────────────────────────────────────────────────────────
const REVIEW_COLORS = {
  UNDER_REVIEW: { bg: '#FFF8E1', color: '#F59E0B', dot: '#F59E0B', label: 'Under Review' },
  APPROVED:     { bg: '#EEFFEE', color: '#43A047', dot: '#43A047', label: 'Approved' },
  REJECTED:     { bg: '#FFF5F5', color: '#E53935', dot: '#E53935', label: 'Rejected' },
}
const CLIENT_COLORS = {
  DRAFT:              { bg: '#F3F4F6', color: '#6B7280', dot: '#9CA3AF', label: 'Draft' },
  SENT:               { bg: '#E2F1FF', color: '#1E88E5', dot: '#1E88E5', label: 'Sent' },
  UNDER_NEGOTIATION:  { bg: '#FAE7FF', color: '#8E24AA', dot: '#8E24AA', label: 'Under Negotiation' },
  ACCEPTED:           { bg: '#EEFFEE', color: '#43A047', dot: '#43A047', label: 'Accepted' },
  REJECTED_BY_CLIENT: { bg: '#FFF5F5', color: '#E53935', dot: '#E53935', label: 'Rejected by Client' },
}

function Badge({ status, map }) {
  const s = map[status] || { bg: '#f3f4f6', color: '#6b7280', dot: '#9ca3af', label: status }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: s.bg, color: s.color, padding: '5px 14px', borderRadius: 20, fontSize: '12px', fontWeight: 600, fontFamily: 'Lato, sans-serif', border: `1px solid ${s.dot}44` }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot }} />
      {s.label}
    </span>
  )
}

function InfoItem({ label, value }) {
  return (
    <div>
      <span style={{ fontSize: '13px', color: '#6b7280', fontFamily: 'Lato, sans-serif' }}>{label} : </span>
      <span style={{ fontSize: '13px', fontWeight: 600, color: '#232323', fontFamily: 'Lato, sans-serif' }}>{value || '—'}</span>
    </div>
  )
}

function Card({ title, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', padding: '20px 24px' }}>
      <div style={{ fontSize: '15px', fontWeight: 700, color: '#122C41', fontFamily: 'Lato, sans-serif', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #f3f4f6' }}>{title}</div>
      {children}
    </div>
  )
}

function InfoGrid({ items, cols = 3 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '10px 0', marginBottom: 10 }}>
      {items.map(({ label, value }) => <InfoItem key={label} label={label} value={value} />)}
    </div>
  )
}

function FilesGrid({ attachments }) {
  if (!attachments?.length) return null
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
      {attachments.map((att, i) => {
        const filename = att.file?.split('/').pop() || `File ${i + 1}`
        const ext = filename.split('.').pop()?.toUpperCase() || 'FILE'
        const sizeMb = att.size ? `${(att.size / (1024 * 1024)).toFixed(0)} MB` : ''
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: `1.5px solid ${i === 0 ? '#3b82f6' : '#e5e7eb'}`, borderRadius: 8, padding: '12px 14px', background: i === 0 ? '#EEF3FF' : '#fafafa' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 8, background: i === 0 ? '#dbeafe' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#122C41" strokeWidth={2}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: i === 0 ? '#122C41' : '#374151', fontFamily: 'Lato, sans-serif' }}>{filename.length > 24 ? filename.slice(0, 24) + '…' : filename}</div>
                <div style={{ fontSize: '11px', color: '#9ca3af', fontFamily: 'Lato, sans-serif' }}>{[sizeMb, ext + ' File'].filter(Boolean).join(' – ')}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <a href={att.file} target="_blank" rel="noopener noreferrer" style={{ color: '#6b7280', display: 'flex', padding: 4 }}>
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </a>
              <a href={att.file} download style={{ color: '#6b7280', display: 'flex', padding: 4 }}>
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              </a>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Commercial Terms Card ─────────────────────────────────────────────────────
function CommercialTermsCard({ terms }) {
  if (!terms) return null
  
  const termItems = [
    { label: 'Payment Terms', value: terms.payment_terms },
    { label: 'Sales Tax', value: terms.sales_tax },
    { label: 'Excise Duty', value: terms.excise_duty },
    { label: 'Warranty', value: terms.warranty },
    { label: 'Packing & Forwarding', value: terms.packing_forwarding },
    { label: 'Price Basis', value: terms.price_basis },
    { label: 'Insurance', value: terms.insurance },
    { label: 'Freight', value: terms.freight },
    { label: 'Delivery', value: terms.delivery },
    { label: 'Validity', value: terms.validity },
    { label: 'Decision Expected', value: terms.decision_expected },
    { label: 'Remarks', value: terms.remarks },
  ]

  return (
    <Card title="Commercial Terms & Conditions">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px 20px' }}>
        {termItems.map(item => (
          item.value && (
            <div key={item.label}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4, fontFamily: 'Lato, sans-serif' }}>
                {item.label}
              </div>
              <div style={{ fontSize: '13px', fontWeight: 500, color: '#232323', fontFamily: 'Lato, sans-serif' }}>
                {item.value}
              </div>
            </div>
          )
        ))}
      </div>
    </Card>
  )
}

// ─── Follow Ups Card ──────────────────────────────────────────────────────────
function FollowUpsCard({ followUps }) {
  if (!followUps?.length) return null
  
  return (
    <Card title={`Follow Ups (${followUps.length})`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {followUps.map((fu, idx) => (
          <div key={idx} style={{ 
            border: '1px solid #e5e7eb', 
            borderRadius: 10, 
            padding: '16px 20px',
            background: idx % 2 === 0 ? '#fafafa' : '#fff'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              marginBottom: 12,
              paddingBottom: 8,
              borderBottom: '1px solid #e5e7eb'
            }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#122C41', fontFamily: 'Lato, sans-serif' }}>
                Follow Up #{idx + 1}
              </span>
              {fu.created_at && (
                <span style={{ fontSize: '11px', color: '#9ca3af', fontFamily: 'Lato, sans-serif' }}>
                  Created: {new Date(fu.created_at).toLocaleDateString()}
                </span>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px 16px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', marginBottom: 2, fontFamily: 'Lato, sans-serif' }}>Follow Up Date</div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: '#232323', fontFamily: 'Lato, sans-serif' }}>{fu.follow_up_date || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', marginBottom: 2, fontFamily: 'Lato, sans-serif' }}>Contact Person</div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: '#232323', fontFamily: 'Lato, sans-serif' }}>{fu.contact_person || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', marginBottom: 2, fontFamily: 'Lato, sans-serif' }}>Contact Phone</div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: '#232323', fontFamily: 'Lato, sans-serif' }}>{fu.contact_phone || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', marginBottom: 2, fontFamily: 'Lato, sans-serif' }}>Contact Email</div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: '#232323', fontFamily: 'Lato, sans-serif' }}>{fu.contact_email || '—'}</div>
              </div>
              {fu.remarks && (
                <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', marginBottom: 2, fontFamily: 'Lato, sans-serif' }}>Remarks</div>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: '#232323', fontFamily: 'Lato, sans-serif' }}>{fu.remarks}</div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default function QuotationExternalDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [quotation, setQuotation]               = useState(null)
  const [loading, setLoading]                   = useState(true)
  const [toast, setToast]                       = useState(null)
  const [showPOModal, setShowPOModal]           = useState(false)
  const [poNumber, setPoNumber]                 = useState('')
  const [savingPO, setSavingPO]                 = useState(false)
  const [showEditModal, setShowEditModal]       = useState(false)
  const [clientActionLoading, setClientActionLoading] = useState(null)
  const [showRejectClient, setShowRejectClient] = useState(false)
  const [rejectRemark, setRejectRemark]         = useState('')
  const [sendingQuotation, setSendingQuotation] = useState(false)
  const [oaBlockMsg, setOaBlockMsg]             = useState('')
  const [activeTab, setActiveTab]               = useState('details')
  
  // Add these new states
  const [showAddFollowUpModal, setShowAddFollowUpModal] = useState(false)
  const [addingFollowUp, setAddingFollowUp] = useState(false)
  const [newFollowUp, setNewFollowUp] = useState({
    follow_up_date: '',
    contact_person: '',
    contact_phone: '',
    contact_email: '',
    remarks: ''
  })

  const refresh = async () => {
    const r = await api.get(`/quotations/${id}/`)
    setQuotation(r.data)
    setPoNumber(r.data.po_number || '')
  }

  useEffect(() => {
    api.get(`/quotations/${id}/`)
      .then(r => { setQuotation(r.data); setPoNumber(r.data.po_number || '') })
      .catch(() => navigate('/employee/quotations'))
      .finally(() => setLoading(false))
  }, [id, navigate])

  const handleEditSuccess = async ({ quotationNumber, wasApproved }) => {
    await refresh()
    setToast(wasApproved
      ? `${quotationNumber} updated — reset to Under Review. Now in Internal view until re-approved.`
      : `${quotationNumber} updated successfully!`
    )
  }

  const handleAddFollowUp = async () => {
  if (!newFollowUp.follow_up_date) {
    alert('Please select a follow-up date')
    return
  }
  
  setAddingFollowUp(true)
  try {
    // Get existing follow-ups
    const currentFollowUps = quotation.follow_ups || []
    
    // Create new payload with existing + new follow-up
    const payload = {
      follow_ups: [
        ...currentFollowUps.map(fu => ({
          follow_up_date: fu.follow_up_date,
          contact_person: fu.contact_person || '',
          contact_phone: fu.contact_phone || '',
          contact_email: fu.contact_email || '',
          remarks: fu.remarks || '',
        })),
        {
          follow_up_date: newFollowUp.follow_up_date,
          contact_person: newFollowUp.contact_person || '',
          contact_phone: newFollowUp.contact_phone || '',
          contact_email: newFollowUp.contact_email || '',
          remarks: newFollowUp.remarks || '',
        }
      ]
    }
    
    await api.patch(`/quotations/${id}/`, payload)
    await refresh()
    setShowAddFollowUpModal(false)
    setNewFollowUp({
      follow_up_date: '',
      contact_person: '',
      contact_phone: '',
      contact_email: '',
      remarks: ''
    })
    setToast('Follow-up added successfully!')
  } catch (err) {
    alert(err?.response?.data ? JSON.stringify(err.response.data) : 'Failed to add follow-up')
  } finally {
    setAddingFollowUp(false)
  }
}

  const handleClientAction = async (action, extra = {}) => {
    setClientActionLoading(action)
    try {
      await api.post(`/quotations/${id}/${action}/`, extra)
      await refresh()
      const msgs = {
        mark_negotiating: 'Status updated to Under Negotiation',
        mark_accepted:    'Quotation Accepted by client!',
        mark_rejected:    'Quotation marked as Rejected by client.',
      }
      setToast(msgs[action] || 'Status updated')
    } catch (err) {
      alert(err?.response?.data ? JSON.stringify(err.response.data) : 'Action failed')
    } finally {
      setClientActionLoading(null)
      setShowRejectClient(false)
    }
  }

  const handleSendQuotation = async () => {
    setSendingQuotation(true)
    try {
      await api.post(`/quotations/${id}/send_to_client/`)
      await refresh()
      setToast('Quotation sent to client successfully!')
    } catch (err) {
      alert(err?.response?.data ? JSON.stringify(err.response.data) : 'Failed to send')
    } finally {
      setSendingQuotation(false)
    }
  }

  const handleSavePO = async () => {
    if (!poNumber.trim()) { alert('Please enter a PO number'); return }
    setSavingPO(true)
    try {
      await api.patch(`/quotations/${id}/`, { po_number: poNumber })
      await refresh()
      setShowPOModal(false)
      setToast('PO Number saved successfully!')
    } catch (err) {
      alert(err?.response?.data ? JSON.stringify(err.response.data) : 'Failed to save PO number')
    } finally {
      setSavingPO(false)
    }
  }

  const handleGenerateOA = async () => {
    if (!quotation?.id) {
      alert('Quotation not found')
      return
    }
    if (!poNumber.trim()) {
      alert('Please enter a PO number')
      return
    }

    if (quotation.client_status === 'REJECTED_BY_CLIENT') {
      setOaBlockMsg('This quotation was rejected by the client. OA cannot be generated.')
      return
    }
    if (quotation.client_status !== 'ACCEPTED') {
      setOaBlockMsg('The quotation must be accepted by the client before generating an OA.')
      return
    }

    setSavingPO(true)
    try {
      await api.patch(`/quotations/${id}/`, { po_number: poNumber })
      const res = await api.post('/orders/oa/initialize/', { quotation: quotation.id })
      const oaId = res.data.id
      setShowPOModal(false)
      navigate(`/employee/order-acknowledgements/${oaId}`)
    } catch (err) {
      console.error(err)
      const msg = err?.response?.data
        ? JSON.stringify(err.response.data)
        : 'Failed to generate OA. Please try again.'
      setOaBlockMsg(msg)
    } finally {
      setSavingPO(false)
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#9ca3af', fontFamily: 'Lato, sans-serif', gap: 12 }}>
      <div style={{ width: 18, height: 18, border: '2px solid #e2e8f0', borderTopColor: '#122C41', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
      Loading…
    </div>
  )
  if (!quotation) return null

  const customer    = quotation.customer_detail || {}
  const poc         = customer.pocs?.find(p => p.is_primary) || customer.pocs?.[0] || {}
  const billing     = customer.addresses?.find(a => a.address_type === 'BILLING') || {}
  const loc         = [customer.city, customer.country].filter(Boolean).join(', ')
  const enqNum      = quotation.enquiry_number
  const clientStatus = quotation.client_status
  const canMarkNegotiating   = clientStatus === 'SENT'
  const canAccept            = ['SENT', 'UNDER_NEGOTIATION'].includes(clientStatus)
  const canRejectByClient    = ['SENT', 'UNDER_NEGOTIATION'].includes(clientStatus)
  const isFinalized          = ['ACCEPTED', 'REJECTED_BY_CLIENT'].includes(clientStatus)
  const canSendQuotation     = ['DRAFT', 'SENT'].includes(clientStatus)
  const showEnterPO          = clientStatus === 'ACCEPTED' || !isFinalized
  
  const prospectiveValue = quotation.enquiry_prospective_value
    ? `${quotation.enquiry_currency || 'INR'} ${Number(quotation.enquiry_prospective_value).toLocaleString('en-IN')}`
    : null

  return (
    <div style={{ fontFamily: 'Lato, sans-serif', padding: '20px 0', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Top bar ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/employee/quotations')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 0, display: 'flex' }}>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <span style={{ fontSize: '22px', fontWeight: 700, color: '#122C41', letterSpacing: '-0.01em' }}>{quotation.quotation_number}</span>
            <Badge status={quotation.client_status} map={CLIENT_COLORS} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingLeft: 28 }}>
            {customer.company_name && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '13px', color: '#6b7280' }}>
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                {customer.company_name}
              </span>
            )}
            {loc && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '13px', color: '#6b7280' }}>
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="12" r="3"/></svg>
                {loc}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={() => window.print()} style={outlineBtn}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            Print
          </button>
          <button onClick={() => setShowEditModal(true)} style={outlineBtn}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Edit Quotation
          </button>

          <QuotationPDFPanel
            quotationId={quotation.id}
            quotationNumber={quotation.quotation_number}
            reviewStatus={quotation.review_status}
            clientStatus={quotation.client_status}
            customerEmail={quotation.customer_detail?.email || ''}
            customerName={quotation.customer_detail?.company_name || ''}
          />

          <button onClick={() => { setShowPOModal(true); setOaBlockMsg('') }} style={primaryBtn}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            {quotation.po_number ? 'Update PO Number' : 'Enter PO Number'}
          </button>
        </div>
      </div>

      {/* ── Client Status Actions bar ── */}
      {!isFinalized && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#122C41', fontFamily: 'Lato, sans-serif', marginRight: 4 }}>Update Client Response:</span>
          {canMarkNegotiating && (
            <button
              onClick={() => handleClientAction('mark_negotiating')}
              disabled={!!clientActionLoading}
              style={{ ...outlineBtn, borderColor: '#8E24AA', color: '#8E24AA', background: '#faf5ff' }}
            >
              {clientActionLoading === 'mark_negotiating' ? 'Updating...' : 'Mark Negotiating'}
            </button>
          )}
          {canAccept && (
            <button
              onClick={() => handleClientAction('mark_accepted')}
              disabled={!!clientActionLoading}
              style={{ ...outlineBtn, borderColor: '#43A047', color: '#43A047', background: '#f0fdf4' }}
            >
              {clientActionLoading === 'mark_accepted' ? 'Updating...' : '✓ Mark Accepted'}
            </button>
          )}
          {canRejectByClient && (
            <button
              onClick={() => setShowRejectClient(true)}
              disabled={!!clientActionLoading}
              style={{ ...outlineBtn, borderColor: '#ef4444', color: '#ef4444', background: '#fef2f2' }}
            >
              Rejected by Client
            </button>
          )}
        </div>
      )}

      {/* Finalized banner */}
      {isFinalized && (
        <div style={{ background: clientStatus === 'ACCEPTED' ? '#EEFFEE' : '#FFF5F5', border: `1px solid ${clientStatus === 'ACCEPTED' ? '#43A04733' : '#E5393533'}`, borderRadius: 8, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '13px', fontFamily: 'Lato, sans-serif', color: clientStatus === 'ACCEPTED' ? '#166534' : '#b91c1c' }}>
            {clientStatus === 'ACCEPTED' ? '✓ This quotation has been Accepted by the client.' : '✕ This quotation was Rejected by the client.'}
            {quotation.po_number && clientStatus === 'ACCEPTED' && <> &nbsp;|&nbsp; PO: <strong>{quotation.po_number}</strong></>}
          </span>
        </div>
      )}

      {/* ========== TAB NAVIGATION - PLACE THIS HERE ========== */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #e5e7eb', marginBottom: 20, marginTop: 10 }}>
        {[
          ['details', 'Quotation Details'],
          ['terms', 'Commercial Terms'],
          ['followups', 'Follow Ups'],
        ].map(([key, label]) => (
          <button 
            key={key} 
            onClick={() => setActiveTab(key)} 
            style={{
              padding: '12px 20px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'Lato, sans-serif',
              fontSize: '14px',
              fontWeight: activeTab === key ? 700 : 500,
              color: activeTab === key ? '#122C41' : '#6b7280',
              borderBottom: `2px solid ${activeTab === key ? '#122C41' : 'transparent'}`,
              marginBottom: -1,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ========== TAB CONTENT - PLACE ALL EXISTING CONTENT INSIDE THE DETAILS TAB ========== */}
      {activeTab === 'details' && (
        <>
          {/* Remarks */}
          <Card title="Remarks">
            <InfoItem label="Remark" value={quotation.manager_remark || 'NIL'} />
            {quotation.po_number && <div style={{ marginTop: 8 }}><InfoItem label="PO Number" value={quotation.po_number} /></div>}
          </Card>

          {/* Enquiry Details */}
          <Card title="Enquiry Details">
            <InfoGrid items={[
              { label: 'Customer Name', value: poc.name || customer.company_name },
              { label: 'Entity Name',   value: customer.company_name },
              { label: 'Designation',   value: poc.designation },
            ]} />
            <InfoGrid items={[
              { label: 'Phone (Landline)', value: customer.telephone_primary },
              { label: 'Phone (Mobile)',   value: poc.phone || customer.telephone_primary },
              { label: 'Email ID',         value: poc.email || customer.email },
            ]} />
            <InfoGrid items={[
              { label: 'Region', value: customer.region },
              { label: 'City',   value: billing.city || customer.city },
              { label: 'State',  value: billing.state || customer.state },
            ]} />
            <div style={{ fontSize: '13px', fontFamily: 'Lato, sans-serif' }}>
              <span style={{ color: '#6b7280' }}>Detailed Address : </span>
              <span style={{ fontWeight: 600, color: '#232323' }}>
                {billing.address_line || [customer.city, customer.state, customer.country].filter(Boolean).join(', ') || '—'}
              </span>
            </div>
          </Card>

          {/* Requirement Details - Now with enquiry data */}
          <Card title="Requirement Details">
            <div style={{ fontSize: '13px', fontFamily: 'Lato, sans-serif', marginBottom: 12 }}>
              <span style={{ color: '#6b7280' }}>Email Subject : </span>
              <span style={{ fontWeight: 600, color: '#232323' }}>{quotation.enquiry_subject || '—'}</span>
            </div>
            <InfoGrid items={[
              { label: 'Quotation Number',  value: enqNum },
              { label: 'Product/Item',      value: quotation.enquiry_product_name || '—' },
              { label: 'Prospective Value', value: prospectiveValue || '—' },
            ]} />
            <InfoGrid items={[
              { label: 'Enquiry Assigned to', value: quotation.assigned_to_name || '—' },
              { label: 'Enquiry Type',        value: quotation.enquiry_type || '—' },
              { label: 'Source of Enquiry',   value: quotation.enquiry_source || '—' },
            ]} />
            <InfoGrid items={[
              { label: 'Region',               value: quotation.enquiry_region || customer.region || '—' },
              { label: 'Due Date',             value: quotation.enquiry_due_date || '—' },
              { label: 'Target DT Submission', value: quotation.enquiry_target_date || '—' },
            ]} />
          </Card>

      {/* Quotation Details */}
      <Card title="Quotation Details">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: quotation.line_items?.length ? 16 : 0 }}>
          <InfoItem label="Quotation Amount" value={quotation.grand_total ? `INR ${Number(quotation.grand_total).toLocaleString('en-IN')}/-` : null} />
          <InfoItem label="Quotation Number" value={quotation.quotation_number} />
          <InfoItem label="Quotation Date"   value={quotation.created_at?.slice(0, 10)} />
        </div>
        {quotation.line_items?.length > 0 && (
          <>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#122C41', fontFamily: 'Lato, sans-serif', marginBottom: 10 }}>
              Product Details ({quotation.line_items.length})
            </div>
            <div style={{ overflowX: 'auto', borderRadius: 8, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 750 }}>
                <thead>
                  <tr style={{ background: '#122C41' }}>
                    {['Job Code', 'Cust. Part No', 'Part No.', 'Name', 'HSN', 'Qty', 'Unit', 'Unit Price', 'Total', 'Tax %'].map(h => (
                      <th key={h} style={{ padding: '9px 10px', fontSize: '11px', fontWeight: 700, color: '#fff', textAlign: 'left', fontFamily: 'Lato, sans-serif', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {quotation.line_items.map((item, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 === 0 ? '#fafafa' : '#fff' }}>
                      {[item.job_code, item.customer_part_no, item.part_no, item.product_name_snapshot, item.hsn_snapshot, item.quantity, item.unit_snapshot, `₹${Number(item.unit_price).toLocaleString('en-IN')}`, `₹${Number(item.line_total).toLocaleString('en-IN')}`, `${item.tax_percent}%`].map((v, j) => (
                        <td key={j} style={{ padding: '9px 10px', fontSize: '12px', fontFamily: 'Lato, sans-serif', color: '#232323', whiteSpace: 'nowrap' }}>{v || '—'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 10, padding: '10px 16px', background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb', textAlign: 'right' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#122C41', fontFamily: 'Lato, sans-serif' }}>
                Subtotal ₹{Number(quotation.total_amount).toLocaleString('en-IN')} &nbsp;+&nbsp; Tax ₹{Number(quotation.tax_amount).toLocaleString('en-IN')} &nbsp;=&nbsp; <span style={{ color: '#1E88E5' }}>Grand Total ₹{Number(quotation.grand_total).toLocaleString('en-IN')}</span>
              </span>
            </div>
          </>
        )}
      </Card>

      {/* Attached Files */}
      {quotation.attachments?.length > 0 && (
        <Card title={`Attached Files (${quotation.attachments.length})`}>
          <FilesGrid attachments={quotation.attachments} />
        </Card>
      )}
        </>
      )}

      {/* Commercial Terms Tab */}
      {activeTab === 'terms' && (
        <CommercialTermsCard terms={quotation.terms} />
      )}

    {/* Follow Ups Tab */}
    {activeTab === 'followups' && (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            onClick={() => setShowAddFollowUpModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 20px',
              background: '#122C41',
              border: 'none',
              borderRadius: 7,
              fontSize: '13px',
              fontWeight: 600,
              color: '#fff',
              cursor: 'pointer',
              fontFamily: 'Lato, sans-serif'
            }}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Follow Up
          </button>
        </div>
        <FollowUpsCard followUps={quotation.follow_ups} />
      </div>
    )}

      {/* ── Edit Modal ── */}
      <EditQuoteModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        quotation={quotation}
        onSuccess={handleEditSuccess}
      />

      {/* ── Reject by Client Modal ── */}
      {showRejectClient && (
        <>
          <div onClick={() => setShowRejectClient(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#fff', borderRadius: 12, width: '90%', maxWidth: 440, zIndex: 1001, boxShadow: '0 20px 60px rgba(0,0,0,0.18)', padding: '28px' }}>
            <div style={{ fontSize: '17px', fontWeight: 700, color: '#122C41', marginBottom: 12, fontFamily: 'Lato, sans-serif' }}>Mark as Rejected by Client</div>
            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: 16, fontFamily: 'Lato, sans-serif' }}>Optionally enter a reason for rejection:</div>
            <textarea
              value={rejectRemark} onChange={e => setRejectRemark(e.target.value)}
              placeholder="Reason for rejection (optional)" rows={3}
              style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 7, fontSize: '13px', fontFamily: 'Lato, sans-serif', outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: 20 }}
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowRejectClient(false)} style={outlineBtn}>Cancel</button>
              <button
                onClick={() => handleClientAction('mark_rejected', { remark: rejectRemark })}
                disabled={!!clientActionLoading}
                style={{ ...outlineBtn, borderColor: '#ef4444', color: '#ef4444', background: '#fef2f2', cursor: 'pointer' }}
              >
                {clientActionLoading === 'mark_rejected' ? 'Saving...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── PO Number Modal ── */}
      {showPOModal && (
        <>
          <div onClick={() => setShowPOModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#fff', borderRadius: 12, width: '90%', maxWidth: 560, zIndex: 1001, boxShadow: '0 24px 80px rgba(0,0,0,0.22)' }}>
            <div style={{ padding: '22px 28px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: '18px', color: '#122C41', fontFamily: 'Lato, sans-serif' }}>Enter PO Number</span>
              <button onClick={() => setShowPOModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
              </button>
            </div>
            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 22 }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', fontFamily: 'Lato, sans-serif', marginBottom: 8 }}>Quotation Number</div>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', top: -9, left: 10, background: '#f9fafb', padding: '0 4px', fontSize: '11px', color: '#6b7280', fontFamily: 'Lato, sans-serif', zIndex: 1 }}>Quotation Number</span>
                  <input readOnly value={quotation.quotation_number}
                    style={{ width: '100%', padding: '11px 14px', border: '2px solid #122C41', borderRadius: 7, fontSize: '14px', fontWeight: 600, fontFamily: 'Lato, sans-serif', color: '#122C41', background: '#f9fafb', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', fontFamily: 'Lato, sans-serif', marginBottom: 8 }}>PO Number</div>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', top: -9, left: 10, background: '#fff', padding: '0 4px', fontSize: '11px', color: '#6b7280', fontFamily: 'Lato, sans-serif', zIndex: 1 }}>Purchase Order Number</span>
                  <textarea
                    value={poNumber}
                    onChange={e => setPoNumber(e.target.value)}
                    placeholder="Enter Purchase Order Number"
                    rows={3}
                    style={{ width: '100%', padding: '11px 14px', border: '1px solid #d1d5db', borderRadius: 7, fontSize: '13px', fontFamily: 'Lato, sans-serif', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            </div>
            <div style={{ padding: '16px 28px', borderTop: '1px solid #f0f0f0' }}>
              {oaBlockMsg && (
                <div style={{ marginBottom: 12, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 7, fontSize: '13px', color: '#b91c1c', fontFamily: 'Lato, sans-serif', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {oaBlockMsg}
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => { setShowPOModal(false); setOaBlockMsg('') }} style={outlineBtn}>Back</button>
                <button
                  onClick={handleSavePO}
                  disabled={savingPO || !poNumber.trim()}
                  style={{ ...outlineBtn, borderColor: '#1E88E5', color: '#1E88E5', background: '#EEF5FF', cursor: (savingPO || !poNumber.trim()) ? 'not-allowed' : 'pointer', opacity: !poNumber.trim() ? .5 : 1 }}
                >
                  {savingPO ? 'Saving...' : 'Save PO'}
                </button>
                <button
                  onClick={handleGenerateOA}
                  disabled={savingPO || !poNumber.trim()}
                  style={{ ...primaryBtn, background: (savingPO || !poNumber.trim()) ? '#94a3b8' : '#122C41', cursor: (savingPO || !poNumber.trim()) ? 'not-allowed' : 'pointer' }}
                >
                  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  Generate OA
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

        {/* Add Follow Up Modal */}
{showAddFollowUpModal && (
  <>
    <div onClick={() => setShowAddFollowUpModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000 }} />
    <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#fff', borderRadius: 12, width: '90%', maxWidth: 520, zIndex: 1001, boxShadow: '0 24px 80px rgba(0,0,0,0.2)' }}>
      <div style={{ padding: '20px 28px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 700, fontSize: '18px', color: '#122C41', fontFamily: 'Lato, sans-serif' }}>Add Follow Up</span>
        <button onClick={() => setShowAddFollowUpModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
        </button>
      </div>
      
      <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: 8, fontFamily: 'Lato, sans-serif' }}>Follow Up Date *</div>
          <input 
            type="date" 
            value={newFollowUp.follow_up_date}
            onChange={e => setNewFollowUp({...newFollowUp, follow_up_date: e.target.value})}
            style={{
              width: '100%',
              padding: '11px 14px',
              border: '1px solid #d1d5db',
              borderRadius: 7,
              fontSize: '13px',
              fontFamily: 'Lato, sans-serif',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>
        
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: 8, fontFamily: 'Lato, sans-serif' }}>Contact Person</div>
          <input 
            type="text"
            value={newFollowUp.contact_person}
            onChange={e => setNewFollowUp({...newFollowUp, contact_person: e.target.value})}
            placeholder="Enter contact person name"
            style={{
              width: '100%',
              padding: '11px 14px',
              border: '1px solid #d1d5db',
              borderRadius: 7,
              fontSize: '13px',
              fontFamily: 'Lato, sans-serif',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: 8, fontFamily: 'Lato, sans-serif' }}>Contact Phone</div>
            <input 
              type="text"
              value={newFollowUp.contact_phone}
              onChange={e => setNewFollowUp({...newFollowUp, contact_phone: e.target.value})}
              placeholder="Phone number"
              style={{
                width: '100%',
                padding: '11px 14px',
                border: '1px solid #d1d5db',
                borderRadius: 7,
                fontSize: '13px',
                fontFamily: 'Lato, sans-serif',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: 8, fontFamily: 'Lato, sans-serif' }}>Contact Email</div>
            <input 
              type="email"
              value={newFollowUp.contact_email}
              onChange={e => setNewFollowUp({...newFollowUp, contact_email: e.target.value})}
              placeholder="Email address"
              style={{
                width: '100%',
                padding: '11px 14px',
                border: '1px solid #d1d5db',
                borderRadius: 7,
                fontSize: '13px',
                fontFamily: 'Lato, sans-serif',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>
        
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: 8, fontFamily: 'Lato, sans-serif' }}>Remarks</div>
          <textarea 
            value={newFollowUp.remarks}
            onChange={e => setNewFollowUp({...newFollowUp, remarks: e.target.value})}
            placeholder="Enter any remarks or notes"
            rows={3}
            style={{
              width: '100%',
              padding: '11px 14px',
              border: '1px solid #d1d5db',
              borderRadius: 7,
              fontSize: '13px',
              fontFamily: 'Lato, sans-serif',
              outline: 'none',
              resize: 'vertical',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>
      
      <div style={{ padding: '16px 28px', borderTop: '1px solid #f0f0f0', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button 
          onClick={() => setShowAddFollowUpModal(false)} 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '9px 22px',
            border: '1px solid #d1d5db',
            borderRadius: 7,
            background: '#fff',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            color: '#374151',
            fontFamily: 'Lato, sans-serif'
          }}
        >
          Cancel
        </button>
        <button 
          onClick={handleAddFollowUp} 
          disabled={addingFollowUp}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '9px 22px',
            border: 'none',
            borderRadius: 7,
            background: addingFollowUp ? '#94a3b8' : '#122C41',
            fontSize: '13px',
            fontWeight: 600,
            cursor: addingFollowUp ? 'not-allowed' : 'pointer',
            color: '#fff',
            fontFamily: 'Lato, sans-serif'
          }}
        >
          {addingFollowUp ? 'Adding...' : 'Add Follow Up'}
        </button>
      </div>
    </div>
  </>
)}

    </div>
  )
}

const outlineBtn = { display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', border: '1px solid #d1d5db', borderRadius: 7, background: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: '#374151', fontFamily: 'Lato, sans-serif' }
const primaryBtn = { display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', border: 'none', borderRadius: 7, background: '#122C41', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: '#fff', fontFamily: 'Lato, sans-serif' }