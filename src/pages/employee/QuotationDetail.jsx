// apps/frontend/src/pages/employee/quotations/QuotationDetail.jsx

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import Toast from '../../components/Toast'
import EditQuoteModal from '../../components/modals/EditQuoteModal'

// ─── Status maps ──────────────────────────────────────────────────────────────
const REVIEW_COLORS = {
  UNDER_REVIEW: { bg: '#FFF8E1', color: '#F59E0B', dot: '#F59E0B', label: 'Under Review' },
  APPROVED:     { bg: '#EEFFEE', color: '#43A047', dot: '#43A047', label: 'Approved' },
  REJECTED:     { bg: '#FFF5F5', color: '#E53935', dot: '#E53935', label: 'Rejected' },
}

function StatusBadge({ status }) {
  const s = REVIEW_COLORS[status] || { bg: '#f3f4f6', color: '#6b7280', dot: '#9ca3af', label: status }
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
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: `1.5px solid ${i === 0 ? '#3b82f6' : '#e5e7eb'}`, borderRadius: 8, padding: '12px 14px', background: i === 0 ? '#EEF3FF' : '#fafafa', transition: 'border .15s' }}>
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

export default function QuotationDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [quotation, setQuotation]     = useState(null)
  const [loading, setLoading]         = useState(true)
  const [toast, setToast]             = useState(null)
  const [sending, setSending]         = useState(false)
  const [showSendConfirm, setShowSendConfirm] = useState(false)
  const [showEditModal, setShowEditModal]     = useState(false)
  const [activeTab, setActiveTab] = useState('details') // details, terms, followups
  
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
  }

  useEffect(() => {
    api.get(`/quotations/${id}/`)
      .then(r => setQuotation(r.data))
      .catch(() => navigate('/employee/quotations'))
      .finally(() => setLoading(false))
  }, [id, navigate])

  const handleEditSuccess = async ({ quotationNumber, wasApproved }) => {
    await refresh()
    setToast(wasApproved
      ? `${quotationNumber} updated — reset to Under Review. Manager re-approval needed.`
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

  const handleSend = async () => {
    setSending(true)
    try {
      await api.post(`/quotations/${id}/send_to_client/`)
      await refresh()
      setShowSendConfirm(false)
      setToast(`Quotation ${quotation.quotation_number} sent to client. Now visible in External view.`)
    } catch (err) {
      alert(err?.response?.data?.error || 'Failed to send — quotation must be Approved first.')
    } finally {
      setSending(false)
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#9ca3af', fontFamily: 'Lato, sans-serif', gap: 12 }}>
      <div style={{ width: 18, height: 18, border: '2px solid #e2e8f0', borderTopColor: '#122C41', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
      Loading…
    </div>
  )
  if (!quotation) return null

  // ── Data extraction ──
  const customer    = quotation.customer_detail || {}
  const poc         = customer.pocs?.find(p => p.is_primary) || customer.pocs?.[0] || {}
  const billing     = customer.addresses?.find(a => a.address_type === 'BILLING') || {}
  const loc         = [customer.city, customer.country].filter(Boolean).join(', ')
  const canSend     = quotation.review_status === 'APPROVED'
  const enqNum      = quotation.enquiry_number

  // Format prospective value
  const prospectiveValue = quotation.enquiry_prospective_value
    ? `${quotation.enquiry_currency || 'INR'} ${Number(quotation.enquiry_prospective_value).toLocaleString('en-IN')}`
    : null

  return (
    <div style={{ fontFamily: 'Lato, sans-serif', padding: '20px 0', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Top bar ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <button onClick={() => navigate('/employee/quotations')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 0, display: 'flex' }}>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <span style={{ fontSize: '22px', fontWeight: 700, color: '#122C41', letterSpacing: '-0.01em' }}>{quotation.quotation_number}</span>
            <StatusBadge status={quotation.review_status} />
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
          <button
            onClick={canSend ? () => setShowSendConfirm(true) : undefined}
            disabled={!canSend}
            title={!canSend ? 'Quotation must be Approved by manager before sending' : 'Send to client'}
            style={{ ...primaryBtn, background: canSend ? '#122C41' : '#94a3b8', cursor: canSend ? 'pointer' : 'not-allowed', opacity: canSend ? 1 : 0.75 }}
          >
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            Send Quotation
          </button>
        </div>
      </div>

      {/* Status banners */}
      {quotation.review_status === 'UNDER_REVIEW' && (
        <div style={{ background: '#FFF8E1', border: '1px solid #F59E0B44', borderRadius: 8, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#F59E0B" strokeWidth={2}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span style={{ fontSize: '13px', color: '#92400e', fontFamily: 'Lato, sans-serif' }}>
            This quotation is <strong>Under Review</strong> — awaiting manager approval before it can be sent to the client.
          </span>
        </div>
      )}
      {quotation.review_status === 'REJECTED' && (
        <div style={{ background: '#FFF5F5', border: '1px solid #E5393544', borderRadius: 8, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#E53935" strokeWidth={2}><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          <span style={{ fontSize: '13px', color: '#b91c1c', fontFamily: 'Lato, sans-serif' }}>
            This quotation was <strong>Rejected</strong> by manager{quotation.manager_remark ? ` — "${quotation.manager_remark}"` : ''}. Please edit and resubmit.
          </span>
        </div>
      )}

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #e5e7eb', marginBottom: 20 }}>
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

      {/* Tab Content */}
      {activeTab === 'details' && (
        <>
          {/* Remarks */}
          {quotation.manager_remark && (
            <Card title="Remarks">
              <InfoItem label="Remark" value={quotation.manager_remark} />
            </Card>
          )}

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

          {/* Requirement Details - Now with all enquiry fields */}
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
              { label: 'Regional Manager',    value: quotation.regional_manager_name || '—' },
              { label: 'Enquiry Type',        value: quotation.enquiry_type || '—' },
            ]} />
            <InfoGrid items={[
              { label: 'Source of Enquiry',   value: quotation.enquiry_source || '—' },
              { label: 'Region',              value: quotation.enquiry_region || customer.region || '—' },
              { label: 'Due Date',            value: quotation.enquiry_due_date || '—' },
            ]} />
            <InfoGrid items={[
              { label: 'Target DT Submission', value: quotation.enquiry_target_date || '—' },
              { label: 'Created By',           value: quotation.enquiry_created_by || '—' },
              { label: 'Created At',           value: quotation.enquiry_created_at ? new Date(quotation.enquiry_created_at).toLocaleDateString() : '—' },
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
              <div style={{ 
                overflowX: 'auto', 
                borderRadius: 8, 
                overflow: 'hidden', 
                border: '1px solid #e5e7eb',
                position: 'relative',
              }}>
                <table style={{ 
                  width: '100%', 
                  borderCollapse: 'collapse', 
                  minWidth: 900,
                  tableLayout: 'fixed'
                }}>
                  <thead>
                    <tr style={{ background: '#122C41' }}>
                      <th style={{ width: '28%', padding: '12px 10px', fontSize: '11px', fontWeight: 700, color: '#fff', textAlign: 'left', fontFamily: 'Lato, sans-serif' }}>Product Name</th>
                      <th style={{ width: '8%', padding: '12px 10px', fontSize: '11px', fontWeight: 700, color: '#fff', textAlign: 'left', fontFamily: 'Lato, sans-serif' }}>Job Code</th>
                      <th style={{ width: '8%', padding: '12px 10px', fontSize: '11px', fontWeight: 700, color: '#fff', textAlign: 'left', fontFamily: 'Lato, sans-serif' }}>Cust. Part No</th>
                      <th style={{ width: '8%', padding: '12px 10px', fontSize: '11px', fontWeight: 700, color: '#fff', textAlign: 'left', fontFamily: 'Lato, sans-serif' }}>Part No.</th>
                      <th style={{ width: '6%', padding: '12px 10px', fontSize: '11px', fontWeight: 700, color: '#fff', textAlign: 'left', fontFamily: 'Lato, sans-serif' }}>HSN</th>
                      <th style={{ width: '6%', padding: '12px 10px', fontSize: '11px', fontWeight: 700, color: '#fff', textAlign: 'right', fontFamily: 'Lato, sans-serif' }}>Qty</th>
                      <th style={{ width: '6%', padding: '12px 10px', fontSize: '11px', fontWeight: 700, color: '#fff', textAlign: 'left', fontFamily: 'Lato, sans-serif' }}>Unit</th>
                      <th style={{ width: '10%', padding: '12px 10px', fontSize: '11px', fontWeight: 700, color: '#fff', textAlign: 'right', fontFamily: 'Lato, sans-serif' }}>Unit Price</th>
                      <th style={{ width: '10%', padding: '12px 10px', fontSize: '11px', fontWeight: 700, color: '#fff', textAlign: 'right', fontFamily: 'Lato, sans-serif' }}>Total</th>
                      <th style={{ width: '6%', padding: '12px 10px', fontSize: '11px', fontWeight: 700, color: '#fff', textAlign: 'center', fontFamily: 'Lato, sans-serif' }}>Tax %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotation.line_items.map((item, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 === 0 ? '#fafafa' : '#fff' }}>
                        <td style={{ 
                          padding: '12px 10px', 
                          fontSize: '12px', 
                          fontFamily: 'Lato, sans-serif', 
                          color: '#232323',
                          wordWrap: 'break-word',
                          wordBreak: 'break-word',
                          whiteSpace: 'normal',
                          lineHeight: '1.4',
                          verticalAlign: 'top'
                        }}>
                          {item.product_name_snapshot || '—'}
                        </td>
                        <td style={{ 
                          padding: '12px 10px', 
                          fontSize: '12px', 
                          fontFamily: 'Lato, sans-serif', 
                          color: '#232323',
                          wordWrap: 'break-word',
                          wordBreak: 'break-word',
                          whiteSpace: 'normal',
                          verticalAlign: 'top'
                        }}>
                          {item.job_code || '—'}
                        </td>
                        <td style={{ 
                          padding: '12px 10px', 
                          fontSize: '12px', 
                          fontFamily: 'Lato, sans-serif', 
                          color: '#232323',
                          wordWrap: 'break-word',
                          wordBreak: 'break-word',
                          whiteSpace: 'normal',
                          verticalAlign: 'top'
                        }}>
                          {item.customer_part_no || '—'}
                        </td>
                        <td style={{ 
                          padding: '12px 10px', 
                          fontSize: '12px', 
                          fontFamily: 'Lato, sans-serif', 
                          color: '#232323',
                          wordWrap: 'break-word',
                          wordBreak: 'break-word',
                          whiteSpace: 'normal',
                          verticalAlign: 'top'
                        }}>
                          {item.part_no || '—'}
                        </td>
                        <td style={{ 
                          padding: '12px 10px', 
                          fontSize: '12px', 
                          fontFamily: 'Lato, sans-serif', 
                          color: '#232323',
                          verticalAlign: 'top'
                        }}>
                          {item.hsn_snapshot || '—'}
                        </td>
                        <td style={{ 
                          padding: '12px 10px', 
                          fontSize: '12px', 
                          fontFamily: 'Lato, sans-serif', 
                          color: '#232323',
                          textAlign: 'right',
                          verticalAlign: 'top'
                        }}>
                          {item.quantity || '—'}
                        </td>
                        <td style={{ 
                          padding: '12px 10px', 
                          fontSize: '12px', 
                          fontFamily: 'Lato, sans-serif', 
                          color: '#232323',
                          verticalAlign: 'top'
                        }}>
                          {item.unit_snapshot || '—'}
                        </td>
                        <td style={{ 
                          padding: '12px 10px', 
                          fontSize: '12px', 
                          fontFamily: 'Lato, sans-serif', 
                          color: '#232323',
                          textAlign: 'right',
                          verticalAlign: 'top',
                          whiteSpace: 'nowrap'
                        }}>
                          ₹{Number(item.unit_price).toLocaleString('en-IN')}
                        </td>
                        <td style={{ 
                          padding: '12px 10px', 
                          fontSize: '12px', 
                          fontWeight: 600,
                          fontFamily: 'Lato, sans-serif', 
                          color: '#1E88E5',
                          textAlign: 'right',
                          verticalAlign: 'top',
                          whiteSpace: 'nowrap'
                        }}>
                          ₹{Number(item.line_total).toLocaleString('en-IN')}
                        </td>
                        <td style={{ 
                          padding: '12px 10px', 
                          fontSize: '12px', 
                          fontFamily: 'Lato, sans-serif', 
                          color: '#232323',
                          textAlign: 'center',
                          verticalAlign: 'top'
                        }}>
                          {item.tax_percent}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: 12, padding: '12px 20px', background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb', textAlign: 'right' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#122C41', fontFamily: 'Lato, sans-serif' }}>
                  Subtotal: <span style={{ fontWeight: 700 }}>₹{Number(quotation.total_amount).toLocaleString('en-IN')}</span> &nbsp;|&nbsp;
                  Tax: <span style={{ fontWeight: 700 }}>₹{Number(quotation.tax_amount).toLocaleString('en-IN')}</span> &nbsp;|&nbsp;
                  <span style={{ color: '#1E88E5', fontSize: '14px' }}>Grand Total: ₹{Number(quotation.grand_total).toLocaleString('en-IN')}</span>
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

      {activeTab === 'terms' && (
        <CommercialTermsCard terms={quotation.terms} />
      )}

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

      {/* Edit Modal */}
      <EditQuoteModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        quotation={quotation}
        onSuccess={handleEditSuccess}
      />

      {/* Send Confirm Modal */}
      {showSendConfirm && (
        <>
          <div onClick={() => setShowSendConfirm(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#fff', borderRadius: 12, width: '90%', maxWidth: 440, zIndex: 1001, boxShadow: '0 20px 60px rgba(0,0,0,0.18)', padding: '28px' }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#122C41', marginBottom: 12, fontFamily: 'Lato, sans-serif' }}>Send Quotation</div>
            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: 20, lineHeight: 1.6, fontFamily: 'Lato, sans-serif' }}>
              Send <strong style={{ color: '#122C41' }}>{quotation.quotation_number}</strong> to the client? Status will change to <strong>Sent</strong> and it will move to External view.
            </div>
            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '12px 16px', marginBottom: 20 }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#122C41', marginBottom: 4, fontFamily: 'Lato, sans-serif' }}>{quotation.quotation_number}</div>
              <div style={{ fontSize: '12px', color: '#6b7280', fontFamily: 'Lato, sans-serif' }}>{customer.company_name}{customer.city ? ` • ${customer.city}` : ''}</div>
              {quotation.grand_total && <div style={{ fontSize: '13px', fontWeight: 600, color: '#122C41', marginTop: 4, fontFamily: 'Lato, sans-serif' }}>₹{Number(quotation.grand_total).toLocaleString('en-IN')}/-</div>}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowSendConfirm(false)} style={outlineBtn}>Cancel</button>
              <button onClick={handleSend} disabled={sending} style={{ ...primaryBtn, background: sending ? '#94a3b8' : '#122C41', cursor: sending ? 'not-allowed' : 'pointer' }}>
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                {sending ? 'Sending...' : 'Send Quotation'}
              </button>
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