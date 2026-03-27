import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import Toast from '../../components/Toast'
import EditQuoteModal from '../../components/modals/EditQuoteModal'

// ── Status colors ─────────────────────────────────────────────────────────────
const REVIEW_COLORS = {
  'UNDER_REVIEW': { bg: '#FFF8E1', color: '#F59E0B', dot: '#F59E0B', label: 'Pending' },
  'APPROVED':     { bg: '#EEFFEE', color: '#43A047', dot: '#43A047', label: 'Approved' },
  'REJECTED':     { bg: '#FFF5F5', color: '#E53935', dot: '#E53935', label: 'Rejected' },
}
const CLIENT_COLORS = {
  'DRAFT':              { bg: '#F3F4F6', color: '#6B7280', dot: '#9CA3AF', label: 'Draft' },
  'SENT':               { bg: '#E2F1FF', color: '#1E88E5', dot: '#1E88E5', label: 'Quoted' },
  'UNDER_NEGOTIATION':  { bg: '#FAE7FF', color: '#8E24AA', dot: '#8E24AA', label: 'Under Negotiation' },
  'ACCEPTED':           { bg: '#EEFFEE', color: '#43A047', dot: '#43A047', label: 'Accepted' },
  'REJECTED_BY_CLIENT': { bg: '#FFF5F5', color: '#E53935', dot: '#E53935', label: 'Rejected by Client' },
}

// model: priority 1=HIGH, 2=MEDIUM, 3=LOW
function toPriorityKey(p) {
  if (p === 1) return 'HIGH'
  if (p === 3) return 'LOW'
  return 'MEDIUM'
}
function fromPriorityKey(k) {
  if (k === 'HIGH') return 1
  if (k === 'LOW') return 3
  return 2
}

function StatusBadge({ status, external }) {
  const s = (external ? CLIENT_COLORS : REVIEW_COLORS)[status] || { bg: '#f3f4f6', color: '#6b7280', dot: '#9ca3af', label: status }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: s.bg, color: s.color, padding: '4px 14px', borderRadius: 20, fontSize: '12px', fontWeight: 600, fontFamily: 'Lato, sans-serif', border: `1px solid ${s.dot}44` }}>
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
      <div style={{ fontSize: '15px', fontWeight: 700, color: '#122C41', fontFamily: 'Lato, sans-serif', marginBottom: 16 }}>{title}</div>
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
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 14px', background: i === 0 ? '#EEF3FF' : '#fafafa' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 6, background: i === 0 ? '#dbeafe' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#122C41" strokeWidth={2}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: i === 0 ? '#122C41' : '#374151', fontFamily: 'Lato, sans-serif' }}>{filename.length > 22 ? filename.slice(0, 22) + '…' : filename}</div>
                <div style={{ fontSize: '11px', color: '#9ca3af', fontFamily: 'Lato, sans-serif' }}>{ext} File</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <a href={att.file} target="_blank" rel="noopener noreferrer" style={{ color: '#6b7280', display: 'flex' }}>
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </a>
              <a href={att.file} download style={{ color: '#6b7280', display: 'flex' }}>
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              </a>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function SidePanel({ icon, title, children }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {icon}
        <span style={{ fontSize: '14px', fontWeight: 700, color: '#122C41', fontFamily: 'Lato, sans-serif' }}>{title}</span>
      </div>
      {children}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ManagerQuotationDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [quotation, setQuotation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [sending, setSending] = useState(false)
  const [showSendConfirm, setShowSendConfirm] = useState(false)
  const [showApproveConfirm, setShowApproveConfirm] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectRemark, setRejectRemark] = useState('')
  const [approving, setApproving] = useState(false)
  const [rejecting, setRejecting] = useState(false)

  // Manager-specific side panel state
  const [employees, setEmployees] = useState([])
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [savingAssignment, setSavingAssignment] = useState(false)
  const [selectedPriority, setSelectedPriority] = useState('MEDIUM')
  const [savingPriority, setSavingPriority] = useState(false)
  const [managerRemark, setManagerRemark] = useState('')

  const refresh = async () => {
    const r = await api.get(`/quotations/${id}/`)
    setQuotation(r.data)
    setSelectedPriority(toPriorityKey(r.data.priority))
    // assigned_to is a numeric FK id; compare as string
    setSelectedEmployee(r.data.assigned_to != null ? String(r.data.assigned_to) : '')
    setManagerRemark(r.data.manager_remark || '')
  }

  useEffect(() => {
    api.get(`/quotations/${id}/`)
      .then(r => {
        setQuotation(r.data)
        setSelectedPriority(toPriorityKey(r.data.priority))
        setSelectedEmployee(r.data.assigned_to != null ? String(r.data.assigned_to) : '')
        setManagerRemark(r.data.manager_remark || '')
      })
      .catch(() => navigate('/manager/quotations'))
      .finally(() => setLoading(false))

    // Fetch employees from the dedicated manager-only endpoint
    // API: GET /api/accounts/tenant/employees/
    // Returns: [{id, username, role}, ...]
    api.get('/accounts/tenant/employees/')
      .then(r => setEmployees(r.data || []))
      .catch(() => {})
  }, [id, navigate])

  const handleEditSuccess = async ({ quotationNumber }) => {
    await refresh()
    setToast(`${quotationNumber} updated successfully!`)
  }

  const handleApprove = async () => {
    setApproving(true)
    try {
      await api.post(`/quotations/${id}/approve/`)
      await refresh()
      setShowApproveConfirm(false)
      setToast(`${quotation.quotation_number} approved!`)
    } catch (err) { alert(err?.response?.data?.detail || 'Approval failed') }
    finally { setApproving(false) }
  }

  const handleReject = async () => {
    setRejecting(true)
    try {
      await api.post(`/quotations/${id}/reject/`, { manager_remark: rejectRemark })
      await refresh()
      setShowRejectModal(false)
      setRejectRemark('')
      setToast(`${quotation.quotation_number} rejected.`)
    } catch (err) { alert(err?.response?.data?.detail || 'Rejection failed') }
    finally { setRejecting(false) }
  }

  const handleSend = async () => {
    setSending(true)
    try {
      await api.post(`/quotations/${id}/send_to_client/`)
      await refresh()
      setShowSendConfirm(false)
      setToast(`${quotation.quotation_number} sent to client!`)
    } catch (err) { alert(err?.response?.data?.error || 'Must be Approved first.') }
    finally { setSending(false) }
  }

  const handleSaveAssignment = async () => {
    if (!selectedEmployee) return
    
    setSavingAssignment(true)
    try {
      // Get the enquiry ID from the quotation
      const enquiryId = quotation.enquiry || quotation.enquiry_id
      
      // Call the Enquiry assign API (NOT quotation patch)
      await api.post(`/enquiries/${enquiryId}/assign/`, { 
        assigned_to: selectedEmployee 
      })
      
      // Refresh to show updated assigned_to_name
      await refresh()
      setToast('Assignment updated successfully!')
    } catch (err) {
      console.error(err)
      setToast(err?.response?.data?.message || 'Failed to update assignment')
    } finally {
      setSavingAssignment(false)
    }
  }

  const handleSavePriority = async () => {
    setSavingPriority(true)
    try {
      await api.patch(`/quotations/${id}/`, { priority: fromPriorityKey(selectedPriority) })
      await refresh()
      setToast('Priority updated!')
    } catch { setToast('Failed to update priority') }
    finally { setSavingPriority(false) }
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#9ca3af', fontFamily: 'Lato, sans-serif' }}>Loading...</div>
  if (!quotation) return null

  const isExternal = quotation.visibility === 'EXTERNAL'
  const canApprove = quotation.review_status === 'UNDER_REVIEW'
  const canReject  = quotation.review_status === 'UNDER_REVIEW'
  const canSend    = quotation.review_status === 'APPROVED' && quotation.client_status !== 'SENT'
  const currentPriorityKey = toPriorityKey(quotation.priority)

  // ── Customer data extraction from nested serializer ──
  const customer = quotation.customer_detail || {}
  
  // Handle POCs (array or single object)
  let primaryPoc = null
  if (customer.pocs) {
    if (Array.isArray(customer.pocs)) {
      primaryPoc = customer.pocs.find(p => p.is_primary) || customer.pocs[0]
    } else {
      primaryPoc = customer.pocs
    }
  }
  
  // Handle addresses (array or single object)
  let billingAddress = null
  if (customer.addresses) {
    if (Array.isArray(customer.addresses)) {
      billingAddress = customer.addresses.find(a => a.address_type === 'BILLING') || customer.addresses[0]
    } else {
      billingAddress = customer.addresses
    }
  }
  
  // Extract POC details with fallbacks
  const pocName = primaryPoc?.name || customer.contact_person || customer.company_name || '—'
  const pocDesignation = primaryPoc?.designation || customer.designation || '—'
  const pocPhone = primaryPoc?.phone || customer.phone_mobile || customer.telephone_primary
  const pocEmail = primaryPoc?.email || customer.email
  
  // Extract address details
  const addressLine = billingAddress?.address_line || billingAddress?.street || ''
  const addressCity = billingAddress?.city || customer.city
  const addressState = billingAddress?.state || customer.state
  const addressCountry = billingAddress?.country || customer.country
  const fullAddress = [addressLine, addressCity, addressState, addressCountry].filter(Boolean).join(', ')
  
  const loc = [addressCity || customer.city, addressCountry || customer.country].filter(Boolean).join(', ')

  const PRIORITY_OPTS = [
    { key: 'LOW',    color: '#22c55e', label: 'Low' },
    { key: 'MEDIUM', color: '#f59e0b', label: 'Medium' },
    { key: 'HIGH',   color: '#ef4444', label: 'High' },
  ]

  return (
    <div style={{ display: 'flex', gap: 24, fontFamily: 'Lato, sans-serif', alignItems: 'flex-start' }}>

      {/* ── LEFT: Main content ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>

        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/manager/quotations')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 0, display: 'flex' }}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <span style={{ fontSize: '20px', fontWeight: 800, color: '#122C41', fontFamily: 'Lato, sans-serif' }}>{quotation.quotation_number}</span>
              <StatusBadge status={isExternal ? quotation.client_status : quotation.review_status} external={isExternal} />
              {/* Inline priority flags */}
              <div style={{ display: 'flex', gap: 4 }}>
                {PRIORITY_OPTS.map(({ key, color }) => (
                  <svg key={key} width="14" height="14" viewBox="0 0 24 24" fill={currentPriorityKey === key ? color : '#e5e7eb'} stroke={currentPriorityKey === key ? color : '#d1d5db'} strokeWidth={1.5}>
                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
                  </svg>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '13px', color: '#6b7280', fontFamily: 'Lato, sans-serif' }}>
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth={2}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                {customer.company_name || quotation.customer_name || '—'}
              </div>
              {loc && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '13px', color: '#6b7280', fontFamily: 'Lato, sans-serif' }}>
                  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth={2}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {loc}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => window.print()} style={outlineBtn}>
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              Print
            </button>
            <button onClick={() => setShowEditModal(true)} style={outlineBtn}>
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Edit Quotation
            </button>
            {canSend && (
              <button onClick={() => setShowSendConfirm(true)} style={primaryBtn}>
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                Send Quotation
              </button>
            )}
          </div>
        </div>

        {/* Enquiry Details */}
        <Card title="Enquiry Details">
          <InfoGrid items={[
            { label: 'Customer Name', value: pocName },
            { label: 'Entity Name', value: customer.company_name || quotation.customer_name || '—' },
            { label: 'Designation', value: pocDesignation },
          ]} />
          <InfoGrid items={[
            { label: 'Phone (Landline)', value: customer.telephone_primary || quotation.phone_landline || '—' },
            { label: 'Phone (Mobile)', value: pocPhone || quotation.phone_mobile || '—' },
            { label: 'Email ID', value: pocEmail || quotation.email || '—' },
          ]} />
          <InfoGrid items={[
            { label: 'Region', value: customer.region || quotation.region || '—' },
            { label: 'City', value: addressCity || customer.city || quotation.city || '—' },
            { label: 'State', value: addressState || customer.state || quotation.state || '—' },
          ]} />
          <div style={{ fontSize: '13px', fontFamily: 'Lato, sans-serif', marginTop: 8 }}>
            <span style={{ color: '#6b7280' }}>Detailed Address : </span>
            <span style={{ fontWeight: 600, color: '#232323' }}>
              {fullAddress || quotation.detailed_address || '—'}
            </span>
          </div>
        </Card>

        {/* Requirement Details */}
        <Card title="Requirement Details">
          <div style={{ fontSize: '13px', fontFamily: 'Lato, sans-serif', marginBottom: 12 }}>
            <span style={{ color: '#6b7280' }}>Email Subject : </span>
            <span style={{ fontWeight: 600, color: '#232323' }}>{quotation.enquiry_subject || quotation.subject || '—'}</span>
          </div>
          <InfoGrid items={[
            { label: 'Quotation Number', value: quotation.enquiry_number || quotation.quotation_number },
            { label: 'Product/Item', value: quotation.enquiry_product_name || quotation.product_name },
            { label: 'Prospective Value', value: quotation.enquiry_prospective_value || quotation.prospective_value 
                ? `INR ${Number(quotation.enquiry_prospective_value || quotation.prospective_value).toLocaleString('en-IN')}` 
                : null },
          ]} />
          <InfoGrid items={[
            { label: 'Enquiry Assigned to', value: quotation.assigned_to_name },
            { label: 'Enquiry Type', value: quotation.enquiry_type || quotation.enquiry_type },
            { label: 'Source of Enquiry', value: quotation.enquiry_source || quotation.source_of_enquiry },
          ]} />
          <InfoGrid items={[
            { label: 'Region', value: customer.region || quotation.region },
            { label: 'Due Date', value: quotation.enquiry_due_date || quotation.due_date },
            { label: 'Target DT Submission', value: quotation.enquiry_target_date || quotation.target_submission_date },
          ]} />
        </Card>

        {/* Quotation Details */}
        <Card title="Quotation Details">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: quotation.line_items?.length ? 16 : 0 }}>
            {/* assigned_to_name = username from serializer */}
            <InfoItem label="Quote Created by" value={quotation.assigned_to_name} />
            <InfoItem label="Quote Days" value={quotation.quote_days != null ? `${quotation.quote_days} Days` : null} />
            <InfoItem label="Quotation Amount" value={quotation.grand_total ? `INR ${Number(quotation.grand_total).toLocaleString('en-IN')}/-` : null} />
            <InfoItem label="Quotation Number" value={quotation.quotation_number} />
            <InfoItem label="Quotation Date" value={quotation.created_at?.slice(0, 10)} />
          </div>
          {quotation.line_items?.length > 0 && (
            <>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#122C41', fontFamily: 'Lato, sans-serif', marginBottom: 10 }}>
                Product Details ({quotation.line_items.length})
              </div>
              <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                  <thead>
                    <tr style={{ background: '#122C41' }}>
                      {['Job Code', 'Cust. Part No', 'Part No.', 'Name', 'HSN', 'Qty', 'Unit', 'Unit Price', 'Total', 'Tax'].map(h => (
                        <th key={h} style={{ padding: '9px 10px', fontSize: '11px', fontWeight: 700, color: '#fff', textAlign: 'left', fontFamily: 'Lato, sans-serif', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {quotation.line_items.map((item, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 === 0 ? '#fafafa' : '#fff' }}>
                        {[item.job_code, item.customer_part_no, item.part_no, item.product_name_snapshot, item.hsn_snapshot, item.quantity, item.unit_snapshot, `₹${Number(item.unit_price).toLocaleString('en-IN')}`, `₹${Number(item.line_total).toLocaleString('en-IN')}`, item.tax_group_code].map((v, j) => (
                          <td key={j} style={{ padding: '9px 10px', fontSize: '12px', fontFamily: 'Lato, sans-serif', color: '#232323', whiteSpace: 'nowrap' }}>{v || '—'}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: 10, padding: '10px 16px', background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb', textAlign: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#122C41', fontFamily: 'Lato, sans-serif' }}>
                  Subtotal ₹{Number(quotation.total_amount).toLocaleString('en-IN')} + Tax ₹{Number(quotation.tax_amount).toLocaleString('en-IN')} = Grand Total ₹{Number(quotation.grand_total).toLocaleString('en-IN')}
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

        {/* Remarks - manager editable */}
        <Card title="Remarks">
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', top: -9, left: 10, background: '#fff', padding: '0 4px', fontSize: '11px', color: '#6b7280', fontFamily: 'Lato, sans-serif', zIndex: 1 }}>Remarks</span>
            <textarea
              value={managerRemark}
              onChange={e => setManagerRemark(e.target.value)}
              rows={4}
              placeholder="Add manager remarks..."
              style={{ width: '100%', padding: '12px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '13px', fontFamily: 'Lato, sans-serif', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
        </Card>

        {/* Approve / Reject footer */}
        {(canApprove || canReject) && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 8, paddingBottom: 16 }}>
            {canReject && (
              <button onClick={() => setShowRejectModal(true)} style={rejectBtn}>Reject Quote</button>
            )}
            {canApprove && (
              <button onClick={() => setShowApproveConfirm(true)} style={primaryBtn}>Approve Quote</button>
            )}
          </div>
        )}
      </div>

      {/* ── RIGHT: Manager side panels ── */}
      <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Assigned To — uses /api/accounts/tenant/employees/ → usernames */}
      <SidePanel
        title="Assigned To"
        icon={<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#6b7280" strokeWidth={2}>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>}
      >
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: 4 }}>
            Enquiry: {quotation.enquiry_number || '—'}
          </div>
        </div>
        
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', top: -9, left: 10, background: '#fff', padding: '0 4px', fontSize: '11px', color: '#6b7280', zIndex: 1 }}>
            Assign To:
          </span>
          <select
            value={selectedEmployee}
            onChange={e => setSelectedEmployee(e.target.value)}
            style={{
              width: '100%', padding: '11px 32px 11px 12px', border: '1px solid #d1d5db', borderRadius: 7,
              fontSize: '13px', fontFamily: 'Lato, sans-serif', color: '#232323',
              outline: 'none', background: '#fff', cursor: 'pointer', appearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
            }}
          >
            <option value="">— Select Employee —</option>
            {employees.map(emp => (
              <option key={emp.id} value={String(emp.id)}>
                {emp.first_name} {emp.last_name} ({emp.username})
              </option>
            ))}
          </select>
        </div>
        
        {selectedEmployee !== (quotation.assigned_to != null ? String(quotation.assigned_to) : '') && (
          <button 
            onClick={handleSaveAssignment} 
            disabled={savingAssignment || !selectedEmployee}
            style={{ 
              ...primaryBtn, 
              width: '100%', 
              justifyContent: 'center', 
              fontSize: '12px', 
              padding: '8px',
              marginTop: 12,
              opacity: (!selectedEmployee || savingAssignment) ? 0.6 : 1
            }}
          >
            {savingAssignment ? 'Updating...' : 'Update Assignment'}
          </button>
        )}
        
        <div style={{ 
          marginTop: 12, 
          paddingTop: 10, 
          borderTop: '1px solid #e5e7eb',
          fontSize: '11px',
          color: '#6b7280'
        }}>
          <span>Current assignee: </span>
          <strong style={{ color: '#122C41' }}>
            {quotation.assigned_to_name || 'Unassigned'}
          </strong>
        </div>
      </SidePanel>

        {/* Set Priority */}
        <SidePanel
          title="Set Priority"
          icon={<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#6b7280" strokeWidth={2}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
        >
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            {PRIORITY_OPTS.map(({ key, color, label }) => (
              <button key={key} onClick={() => setSelectedPriority(key)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: 0 }}>
                <svg width="28" height="28" viewBox="0 0 24 24"
                  fill={selectedPriority === key ? color : '#f3f4f6'}
                  stroke={selectedPriority === key ? color : '#d1d5db'}
                  strokeWidth={1.5}
                  style={{ transform: selectedPriority === key ? 'scale(1.15)' : 'scale(1)', transition: 'all 0.15s' }}
                >
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
                </svg>
                <span style={{ fontSize: '10px', fontFamily: 'Lato, sans-serif', color: selectedPriority === key ? color : '#9ca3af', fontWeight: 600 }}>{label}</span>
              </button>
            ))}
          </div>
          {selectedPriority !== currentPriorityKey && (
            <button onClick={handleSavePriority} disabled={savingPriority} style={{ ...primaryBtn, width: '100%', justifyContent: 'center', fontSize: '12px', padding: '8px' }}>
              {savingPriority ? 'Saving...' : 'Save Priority'}
            </button>
          )}
        </SidePanel>

        {/* Review Status info */}
        <SidePanel
          title="Review Status"
          icon={<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#6b7280" strokeWidth={2}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
        >
          <StatusBadge status={quotation.review_status} external={false} />
          {isExternal && (
            <div>
              <div style={{ fontSize: '11px', color: '#6b7280', fontFamily: 'Lato, sans-serif', marginBottom: 4 }}>Client Status</div>
              <StatusBadge status={quotation.client_status} external={true} />
            </div>
          )}
          {quotation.manager_remark && quotation.review_status === 'REJECTED' && (
            <div style={{ padding: '10px 12px', background: '#fff5f5', border: '1px solid #fecaca', borderRadius: 6 }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#ef4444', fontFamily: 'Lato, sans-serif', marginBottom: 2 }}>Rejection Remark</div>
              <div style={{ fontSize: '12px', color: '#374151', fontFamily: 'Lato, sans-serif' }}>{quotation.manager_remark}</div>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: '12px', color: '#6b7280', fontFamily: 'Lato, sans-serif' }}>
              <span style={{ fontWeight: 600 }}>Quote Days: </span>{quotation.quote_days != null ? `${quotation.quote_days} Days` : '—'}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280', fontFamily: 'Lato, sans-serif' }}>
              <span style={{ fontWeight: 600 }}>Valid Till: </span>{quotation.valid_till_date || '—'}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280', fontFamily: 'Lato, sans-serif' }}>
              <span style={{ fontWeight: 600 }}>Visibility: </span>{quotation.visibility}
            </div>
          </div>
        </SidePanel>
      </div>

      {/* ── Modals ── */}

      {/* Edit */}
      <EditQuoteModal open={showEditModal} onClose={() => setShowEditModal(false)} quotation={quotation} onSuccess={handleEditSuccess} />

      {/* Approve confirm */}
      {showApproveConfirm && (
        <>
          <div onClick={() => setShowApproveConfirm(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#fff', borderRadius: 12, width: '90%', maxWidth: 440, zIndex: 1001, boxShadow: '0 20px 60px rgba(0,0,0,0.18)', padding: '28px' }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#122C41', marginBottom: 12, fontFamily: 'Lato, sans-serif' }}>Approve Quotation</div>
            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: 20, lineHeight: 1.6, fontFamily: 'Lato, sans-serif' }}>
              Approve <strong style={{ color: '#122C41' }}>{quotation.quotation_number}</strong>? Status will become <strong>Approved</strong> and it will be available to send to the client.
            </div>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '12px 16px', marginBottom: 20 }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#15803d', fontFamily: 'Lato, sans-serif' }}>{quotation.quotation_number}</div>
              <div style={{ fontSize: '12px', color: '#6b7280', fontFamily: 'Lato, sans-serif' }}>{customer.company_name || quotation.customer_name}</div>
              {quotation.grand_total && <div style={{ fontSize: '13px', fontWeight: 600, color: '#122C41', marginTop: 4, fontFamily: 'Lato, sans-serif' }}>₹{Number(quotation.grand_total).toLocaleString('en-IN')}/-</div>}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowApproveConfirm(false)} style={outlineBtn}>Cancel</button>
              <button onClick={handleApprove} disabled={approving} style={{ ...primaryBtn, opacity: approving ? 0.7 : 1, cursor: approving ? 'not-allowed' : 'pointer' }}>
                {approving ? 'Approving...' : 'Approve Quotation'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Reject modal */}
      {showRejectModal && (
        <>
          <div onClick={() => setShowRejectModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#fff', borderRadius: 12, width: '90%', maxWidth: 480, zIndex: 1001, boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: '17px', color: '#122C41', fontFamily: 'Lato, sans-serif' }}>Reject Quotation</span>
              <button onClick={() => setShowRejectModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
              </button>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <div style={{ background: '#fff5f5', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: '13px', color: '#122C41', fontFamily: 'Lato, sans-serif' }}>{quotation.quotation_number}</div>
                <div style={{ fontSize: '12px', color: '#6b7280', fontFamily: 'Lato, sans-serif' }}>{customer.company_name || quotation.customer_name}</div>
              </div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: 6, fontFamily: 'Lato, sans-serif' }}>
                Manager Remark <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span>
              </label>
              <textarea
                value={rejectRemark} onChange={e => setRejectRemark(e.target.value)}
                placeholder="Reason for rejection..." rows={3}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 7, fontSize: '13px', fontFamily: 'Lato, sans-serif', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ padding: '14px 24px', borderTop: '1px solid #f0f0f0', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowRejectModal(false)} style={outlineBtn}>Back</button>
              <button onClick={handleReject} disabled={rejecting} style={{ ...rejectBtn, background: rejecting ? '#fca5a5' : '#ef4444', color: '#fff', border: 'none', cursor: rejecting ? 'not-allowed' : 'pointer' }}>
                {rejecting ? 'Rejecting...' : 'Reject Quotation'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Send confirm */}
      {showSendConfirm && (
        <>
          <div onClick={() => setShowSendConfirm(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#fff', borderRadius: 12, width: '90%', maxWidth: 440, zIndex: 1001, boxShadow: '0 20px 60px rgba(0,0,0,0.18)', padding: '28px' }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#122C41', marginBottom: 12, fontFamily: 'Lato, sans-serif' }}>Send Quotation</div>
            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: 20, lineHeight: 1.6, fontFamily: 'Lato, sans-serif' }}>
              Send <strong style={{ color: '#122C41' }}>{quotation.quotation_number}</strong> to the client? Status will change to <strong>Sent</strong>.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowSendConfirm(false)} style={outlineBtn}>Cancel</button>
              <button onClick={handleSend} disabled={sending} style={{ ...primaryBtn, opacity: sending ? 0.7 : 1, cursor: sending ? 'not-allowed' : 'pointer' }}>
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                {sending ? 'Sending...' : 'Send Quotation'}
              </button>
            </div>
          </div>
        </>
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  ) 
}

const outlineBtn = { display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', border: '1px solid #d1d5db', borderRadius: 7, background: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: '#374151', fontFamily: 'Lato, sans-serif' }
const primaryBtn = { display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', border: 'none', borderRadius: 7, background: '#122C41', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: '#fff', fontFamily: 'Lato, sans-serif' }
const rejectBtn = { display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', border: '1px solid #ef4444', borderRadius: 7, background: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: '#ef4444', fontFamily: 'Lato, sans-serif' }