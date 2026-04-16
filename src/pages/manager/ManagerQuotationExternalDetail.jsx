// apps/frontend/src/pages/manager/quotations/ManagerQuotationExternalDetail.jsx

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import Toast from '../../components/Toast'
import EditQuoteModal from '../../components/modals/EditQuoteModal'
import QuotationPDFPanel from '../../components/QuotationPDFPanel'
import { printQuotationDetail } from '../../components/PrintQuotationDetail'

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

const PRIORITY_ORDER = ['LOW', 'MEDIUM', 'HIGH']
const PRIORITY_COLORS = { LOW: '#22c55e', MEDIUM: '#f59e0b', HIGH: '#ef4444' }
const PRIORITY_LABELS = { LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High' }

function FlagIcon({ active, color, size = 18 }) {
  const c = active ? color : '#d1d5db'
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <line x1="4" y1="2" x2="4" y2="18" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4 3.5 L15.5 3.5 Q16.5 3.5 16 4.5 L13.5 8.5 L16 12.5 Q16.5 13.5 15.5 13.5 L4 13.5 Z" fill={c} />
    </svg>
  )
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

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 4, marginBottom: 10 }}>
      <span style={{ fontSize: '13px', color: '#6b7280', fontFamily: 'Lato, sans-serif', minWidth: 120 }}>{label} :</span>
      <span style={{ fontSize: '13px', fontWeight: 600, color: '#232323', fontFamily: 'Lato, sans-serif', wordBreak: 'break-word' }}>{value || '—'}</span>
    </div>
  )
}

function Card({ title, children, noPadding = false }) {
  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
      <div style={{ fontSize: '15px', fontWeight: 700, color: '#122C41', fontFamily: 'Lato, sans-serif', padding: '16px 20px', background: '#fafafa', borderBottom: '1px solid #e5e7eb' }}>{title}</div>
      <div style={{ padding: noPadding ? 0 : '16px 20px' }}>
        {children}
      </div>
    </div>
  )
}

function TwoColumnGrid({ children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px 24px' }}>
      {children}
    </div>
  )
}

function FilesGrid({ attachments }) {
  if (!attachments?.length) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {attachments.map((att, i) => {
        const filename = att.file?.split('/').pop() || `File ${i + 1}`
        const ext = filename.split('.').pop()?.toUpperCase() || 'FILE'
        const sizeMb = att.size ? `${(att.size / (1024 * 1024)).toFixed(0)} MB` : ''
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 14px', background: '#fafafa' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
              <div style={{ width: 34, height: 34, borderRadius: 6, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#122C41" strokeWidth={2}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', fontFamily: 'Lato, sans-serif', wordBreak: 'break-all' }}>{filename}</div>
                <div style={{ fontSize: '11px', color: '#9ca3af', fontFamily: 'Lato, sans-serif' }}>{[sizeMb, ext + ' File'].filter(Boolean).join(' – ')}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <a href={att.file} target="_blank" rel="noopener noreferrer" style={{ color: '#6b7280', padding: 4 }}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </a>
              <a href={att.file} download style={{ color: '#6b7280', padding: 4 }}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              </a>
            </div>
          </div>
        )
      })}
    </div>
  )
}

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

  const visibleItems = termItems.filter(item => item.value)

  return (
    <Card title="Commercial Terms & Conditions">
      <TwoColumnGrid>
        {visibleItems.map(item => (
          <div key={item.label}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4, fontFamily: 'Lato, sans-serif' }}>
              {item.label}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 500, color: '#232323', fontFamily: 'Lato, sans-serif', wordBreak: 'break-word' }}>
              {item.value}
            </div>
          </div>
        ))}
      </TwoColumnGrid>
    </Card>
  )
}

function FollowUpsCard({ followUps }) {
  if (!followUps?.length) return null
  
  return (
    <Card title={`Follow Ups (${followUps.length})`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {followUps.map((fu, idx) => (
          <div key={idx} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 16px', background: idx % 2 === 0 ? '#fafafa' : '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid #e5e7eb' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#122C41', fontFamily: 'Lato, sans-serif' }}>
                Follow Up #{idx + 1}
              </span>
              {fu.created_at && (
                <span style={{ fontSize: '11px', color: '#9ca3af', fontFamily: 'Lato, sans-serif' }}>
                  Created: {new Date(fu.created_at).toLocaleDateString()}
                </span>
              )}
            </div>
            <TwoColumnGrid>
              <InfoRow label="Follow Up Date" value={fu.follow_up_date} />
              <InfoRow label="Contact Person" value={fu.contact_person} />
              <InfoRow label="Contact Phone" value={fu.contact_phone} />
              <InfoRow label="Contact Email" value={fu.contact_email} />
              {fu.remarks && <InfoRow label="Remarks" value={fu.remarks} />}
            </TwoColumnGrid>
          </div>
        ))}
      </div>
    </Card>
  )
}

// Replace the existing ProductsTable component with this enhanced version

function ProductsTable({ items, totalAmount, taxAmount, grandTotal }) {
  if (!items?.length) return null

  // Format currency
  const formatCurrency = (value) => {
    if (!value && value !== 0) return '—'
    return `₹${Number(value).toLocaleString('en-IN')}`
  }

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ 
        fontSize: '15px', 
        fontWeight: 700, 
        color: '#122C41', 
        fontFamily: 'Lato, sans-serif', 
        marginBottom: 16,
        paddingBottom: 8,
        borderBottom: '2px solid #e5e7eb'
      }}>
        Product Details ({items.length})
      </div>
      <div style={{ 
        overflowX: 'auto', 
        borderRadius: 8, 
        border: '1px solid #e5e7eb',
        marginBottom: 16
      }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse', 
          minWidth: 1100, 
          fontSize: '12px',
          fontFamily: 'Lato, sans-serif'
        }}>
          <thead>
            <tr style={{ background: '#122C41' }}>
              <th style={{ padding: '12px 10px', fontWeight: 700, color: '#fff', textAlign: 'left', whiteSpace: 'nowrap' }}>Job Code</th>
              <th style={{ padding: '12px 10px', fontWeight: 700, color: '#fff', textAlign: 'left', whiteSpace: 'nowrap' }}>Cust. Part No.</th>
              <th style={{ padding: '12px 10px', fontWeight: 700, color: '#fff', textAlign: 'left', whiteSpace: 'nowrap' }}>Part No.</th>
              <th style={{ padding: '12px 10px', fontWeight: 700, color: '#fff', textAlign: 'left', whiteSpace: 'normal', minWidth: 200 }}>Product Name</th>
              <th style={{ padding: '12px 10px', fontWeight: 700, color: '#fff', textAlign: 'left', whiteSpace: 'nowrap' }}>HSN</th>
              <th style={{ padding: '12px 10px', fontWeight: 700, color: '#fff', textAlign: 'center', whiteSpace: 'nowrap' }}>Qty</th>
              <th style={{ padding: '12px 10px', fontWeight: 700, color: '#fff', textAlign: 'left', whiteSpace: 'nowrap' }}>Unit</th>
              <th style={{ padding: '12px 10px', fontWeight: 700, color: '#fff', textAlign: 'right', whiteSpace: 'nowrap' }}>Unit Price</th>
              <th style={{ padding: '12px 10px', fontWeight: 700, color: '#fff', textAlign: 'right', whiteSpace: 'nowrap' }}>Total</th>
              <th style={{ padding: '12px 10px', fontWeight: 700, color: '#fff', textAlign: 'center', whiteSpace: 'nowrap' }}>Tax %</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} style={{ 
                borderBottom: '1px solid #f0f0f0', 
                background: i % 2 === 0 ? '#fafafa' : '#fff',
                verticalAlign: 'top'
              }}>
                <td style={{ padding: '12px 10px', color: '#232323', wordBreak: 'break-word' }}>{item.job_code || '—'}</td>
                <td style={{ padding: '12px 10px', color: '#232323', wordBreak: 'break-word' }}>{item.cust_part_no || item.customer_part_no || '—'}</td>
                <td style={{ padding: '12px 10px', color: '#232323', wordBreak: 'break-word' }}>{item.part_no || '—'}</td>
                <td style={{ 
                  padding: '12px 10px', 
                  color: '#232323', 
                  wordBreak: 'break-word', 
                  whiteSpace: 'normal',
                  lineHeight: 1.4,
                  minWidth: 220,
                  maxWidth: 280
                }}>
                  {item.product_name_snapshot || item.product_name || '—'}
                </td>
                <td style={{ padding: '12px 10px', color: '#232323', whiteSpace: 'nowrap' }}>{item.hsn_code || item.hsn || '—'}</td>
                <td style={{ padding: '12px 10px', color: '#232323', textAlign: 'center', whiteSpace: 'nowrap' }}>{item.quantity || item.qty || '—'}</td>
                <td style={{ padding: '12px 10px', color: '#232323', whiteSpace: 'nowrap' }}>{item.unit || 'Nos'}</td>
                <td style={{ padding: '12px 10px', color: '#232323', textAlign: 'right', whiteSpace: 'nowrap' }}>{formatCurrency(item.unit_price)}</td>
                <td style={{ padding: '12px 10px', color: '#232323', textAlign: 'right', whiteSpace: 'nowrap' }}>{formatCurrency(item.line_total)}</td>
                <td style={{ padding: '12px 10px', color: '#232323', textAlign: 'center', whiteSpace: 'nowrap' }}>{item.tax_rate || item.tax_percent || '18%'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ 
        marginTop: 8, 
        padding: '14px 20px', 
        background: '#f9fafb', 
        borderRadius: 8, 
        border: '1px solid #e5e7eb', 
        textAlign: 'right' 
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: 24,
          flexWrap: 'wrap',
          fontSize: '13px',
          fontWeight: 500,
          color: '#374151'
        }}>
          <span>Subtotal: <strong>{formatCurrency(totalAmount)}</strong></span>
          <span>Tax: <strong>{formatCurrency(taxAmount)}</strong></span>
          <span style={{ color: '#1E88E5', fontSize: '14px', fontWeight: 700 }}>
            Grand Total: <strong>{formatCurrency(grandTotal)}</strong>
          </span>
        </div>
      </div>
    </div>
  )
}

// Helper functions
function resolveEmpName(emp) {
  if (!emp) return null
  const full = [emp.first_name, emp.last_name].filter(Boolean).join(' ').trim()
  return full || emp.username || null
}

function resolveEmpId(emp) {
  return emp?.id ?? null
}

export default function ManagerQuotationExternalDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [quotation, setQuotation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [showPOModal, setShowPOModal] = useState(false)
  const [poNumber, setPoNumber] = useState('')
  const [savingPO, setSavingPO] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [clientActionLoading, setClientActionLoading] = useState(null)
  const [showRejectClient, setShowRejectClient] = useState(false)
  const [rejectRemark, setRejectRemark] = useState('')
  const [sendingQuotation, setSendingQuotation] = useState(false)
  const [oaBlockMsg, setOaBlockMsg] = useState('')
  
  // Manager-specific states
  const [employees, setEmployees] = useState([])
  const [empMap, setEmpMap] = useState({})
  const [savingPriority, setSavingPriority] = useState(false)
  const [savingAssign, setSavingAssign] = useState(false)
  const [assignTo, setAssignTo] = useState('')
  const [approvalLoading, setApprovalLoading] = useState(false)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [activeTab, setActiveTab] = useState('details')  // <-- ADD THIS LINE
  
  // Follow-up states
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
    setAssignTo(String(r.data.enquiry?.assigned_to?.id || r.data.assigned_to_id || ''))
  }

  // Fetch employees for assignment dropdown
  useEffect(() => {
    Promise.all([
      api.get(`/quotations/${id}/`),
      api.get('/accounts/tenant/employees/').catch(() => ({ data: [] })),
    ])
      .then(([quotationRes, empRes]) => {
        setQuotation(quotationRes.data)
        setPoNumber(quotationRes.data.po_number || '')
        setAssignTo(String(quotationRes.data.enquiry?.assigned_to?.id || quotationRes.data.assigned_to_id || ''))
        
        const empList = empRes.data?.results || empRes.data || []
        setEmployees(empList)
        const map = {}
        empList.forEach(emp => {
          const eid = resolveEmpId(emp)
          const name = resolveEmpName(emp)
          if (eid != null) {
            map[eid] = name
            map[String(eid)] = name
          }
        })
        setEmpMap(map)
      })
      .catch(() => navigate('/manager/quotations'))
      .finally(() => setLoading(false))
  }, [id, navigate])

  const handleEditSuccess = async ({ quotationNumber, wasApproved }) => {
    await refresh()
    setToast(wasApproved
      ? `${quotationNumber} updated — reset to Under Review. Now needs re-approval.`
      : `${quotationNumber} updated successfully!`
    )
  }

  const handleApprove = async () => {
    setApprovalLoading(true)
    try {
      await api.post(`/quotations/${id}/approve/`)
      await refresh()
      setToast('Quotation approved successfully!')
      setShowApproveModal(false)
    } catch (err) {
      alert(err?.response?.data ? JSON.stringify(err.response.data) : 'Approval failed')
    } finally {
      setApprovalLoading(false)
    }
  }

  const handleReject = async () => {
    setApprovalLoading(true)
    try {
      await api.post(`/quotations/${id}/reject/`, { manager_remark: rejectReason })
      await refresh()
      setToast('Quotation rejected!')
      setShowRejectModal(false)
      setRejectReason('')
    } catch (err) {
      alert(err?.response?.data ? JSON.stringify(err.response.data) : 'Rejection failed')
    } finally {
      setApprovalLoading(false)
    }
  }

  const handleSetPriority = async (priority) => {
    setSavingPriority(true)
    try {
      await api.patch(`/enquiries/${quotation.enquiry}/`, { priority })
      await refresh()
      setToast(`Priority set to ${PRIORITY_LABELS[priority]}`)
    } catch (err) {
      alert(err?.response?.data ? JSON.stringify(err.response.data) : 'Failed to set priority.')
    } finally {
      setSavingPriority(false)
    }
  }

  const handleAssign = async () => {
    if (!assignTo) return
    setSavingAssign(true)
    try {
      await api.post(`/enquiries/${quotation.enquiry}/assign/`, { assigned_to: assignTo })
      await refresh()
      setToast('Assigned successfully!')
    } catch (err) {
      alert(err?.response?.data ? JSON.stringify(err.response.data) : 'Assign failed.')
    } finally {
      setSavingAssign(false)
    }
  }

  const handleAddFollowUp = async () => {
    if (!newFollowUp.follow_up_date) {
      alert('Please select a follow-up date')
      return
    }
    
    setAddingFollowUp(true)
    try {
      const currentFollowUps = quotation.follow_ups || []
      
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
      navigate(`/manager/order-acknowledgements/${oaId}`)
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

  const quoteDays = quotation?.created_at
    ? Math.floor((Date.now() - new Date(quotation.created_at)) / 86400000)
    : null

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#9ca3af', fontFamily: 'Lato, sans-serif', gap: 12 }}>
      <div style={{ width: 18, height: 18, border: '2px solid #e2e8f0', borderTopColor: '#122C41', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
      Loading…
    </div>
  )
  if (!quotation) return null

  const customer = quotation.customer_detail || {}
  const poc = customer.pocs?.find(p => p.is_primary) || customer.pocs?.[0] || {}
  const billing = customer.addresses?.find(a => a.address_type === 'BILLING') || {}
  const loc = [customer.city, customer.country].filter(Boolean).join(', ')
  const enqNum = quotation.enquiry_number
  const clientStatus = quotation.client_status
  const reviewStatus = quotation.review_status
  const visibility = quotation.visibility
  
  const canApprove = reviewStatus === 'UNDER_REVIEW'
  const canReject = reviewStatus === 'UNDER_REVIEW'
  const isApproved = reviewStatus === 'APPROVED'
  
  const canMarkNegotiating = clientStatus === 'SENT'
  const canAccept = ['SENT', 'UNDER_NEGOTIATION'].includes(clientStatus)
  const canRejectByClient = ['SENT', 'UNDER_NEGOTIATION'].includes(clientStatus)
  const isFinalized = ['ACCEPTED', 'REJECTED_BY_CLIENT'].includes(clientStatus)
  const canSendQuotation = ['DRAFT', 'SENT'].includes(clientStatus) && reviewStatus === 'APPROVED'
  
  const prospectiveValue = quotation.enquiry_prospective_value
    ? `${quotation.enquiry_currency || 'INR'} ${Number(quotation.enquiry_prospective_value).toLocaleString('en-IN')}`
    : null

  const assignedName = empMap[assignTo] || quotation.assigned_to_name || '—'
  const priority = quotation.enquiry_priority || 'MEDIUM'

  return (
    <div style={{ fontFamily: 'Lato, sans-serif', padding: '20px 0', maxWidth: 1400, margin: '0 auto' }}>
     <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        
        /* Better table cell text wrapping */
        .product-name-cell {
          word-wrap: break-word;
          word-break: break-word;
          white-space: normal !important;
          line-height: 1.4;
        }
        
        /* Responsive table container */
        .table-container {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        
        /* Ensure sticky sidebar works */
        @media (max-width: 1024px) {
          .sidebar-sticky {
            position: relative;
            top: 0;
          }
        }
      `}</style>

      {/* Header Section */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/manager/quotations')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 4, display: 'flex' }}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <span style={{ fontSize: '24px', fontWeight: 700, color: '#122C41' }}>{quotation.quotation_number}</span>
            <Badge status={reviewStatus} map={REVIEW_COLORS} />
            <Badge status={clientStatus} map={CLIENT_COLORS} />
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => printQuotationDetail(quotation)} style={outlineBtn}>
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              Print
            </button>
            
            <button onClick={() => setShowEditModal(true)} style={outlineBtn}>
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Edit
            </button>

            <QuotationPDFPanel
              quotationId={quotation.id}
              quotationNumber={quotation.quotation_number}
              reviewStatus={quotation.review_status}
              clientStatus={quotation.client_status}
              customerEmail={quotation.customer_detail?.email || ''}
              customerName={quotation.customer_detail?.company_name || ''}
              onQuotationSent={refresh}
            />

            {canApprove && (
              <button onClick={() => setShowApproveModal(true)} style={{ ...primaryBtn, background: '#43A047' }}>
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="20 6 9 17 4 12"/></svg>
                Approve
              </button>
            )}
            {canReject && (
              <button onClick={() => setShowRejectModal(true)} style={{ ...outlineBtn, borderColor: '#ef4444', color: '#ef4444' }}>
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                Reject
              </button>
            )}

            <button onClick={() => { setShowPOModal(true); setOaBlockMsg('') }} style={primaryBtn}>
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              {quotation.po_number ? 'Update PO' : 'Add PO'}
            </button>
          </div>
        </div>

        {/* Customer info row under header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, paddingLeft: 32, flexWrap: 'wrap' }}>
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

        {/* Main Content - Two Column Layout with responsive breakpoints */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'row', 
          gap: 24, 
          alignItems: 'flex-start',
          flexWrap: 'wrap'
        }}>

          {/* LEFT COLUMN - Main Content - takes remaining space */}
          <div style={{ 
            flex: '1 1 0%', 
            minWidth: 0,
            overflowX: 'auto'
          }}>

          {/* Tab Navigation */}
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
                  padding: '10px 20px',
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

          {/* Tab: Details */}
          {activeTab === 'details' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Remarks Card */}
              <Card title="Remarks">
                <InfoRow label="Remark" value={quotation.manager_remark || 'NIL'} />
                {quotation.po_number && <InfoRow label="PO Number" value={quotation.po_number} />}
              </Card>

              {/* Enquiry Details - Single column for better readability */}
              <Card title="Enquiry Details">
                <TwoColumnGrid>
                  <InfoRow label="Customer Name" value={poc.name || customer.company_name} />
                  <InfoRow label="Entity Name" value={customer.company_name} />
                  <InfoRow label="Designation" value={poc.designation} />
                  <InfoRow label="Phone (Landline)" value={customer.telephone_primary} />
                  <InfoRow label="Phone (Mobile)" value={poc.phone || customer.telephone_primary} />
                  <InfoRow label="Email ID" value={poc.email || customer.email} />
                  <InfoRow label="Region" value={customer.region} />
                  <InfoRow label="City" value={billing.city || customer.city} />
                  <InfoRow label="State" value={billing.state || customer.state} />
                </TwoColumnGrid>
                <InfoRow label="Detailed Address" value={billing.address_line || [customer.city, customer.state, customer.country].filter(Boolean).join(', ') || '—'} />
              </Card>

              {/* Requirement Details */}
              <Card title="Requirement Details">
                <div style={{ marginBottom: 12 }}>
                  <InfoRow label="Email Subject" value={quotation.enquiry_subject || '—'} />
                </div>
                <TwoColumnGrid>
                  <InfoRow label="Quotation Number" value={enqNum} />
                  <InfoRow label="Product/Item" value={quotation.enquiry_product_name || '—'} />
                  <InfoRow label="Prospective Value" value={prospectiveValue || '—'} />
                  <InfoRow label="Enquiry Assigned to" value={assignedName} />
                  <InfoRow label="Enquiry Type" value={quotation.enquiry_type || '—'} />
                  <InfoRow label="Source of Enquiry" value={quotation.enquiry_source || '—'} />
                  <InfoRow label="Region" value={quotation.enquiry_region || customer.region || '—'} />
                  <InfoRow label="Due Date" value={quotation.enquiry_due_date || '—'} />
                  <InfoRow label="Target DT Submission" value={quotation.enquiry_target_date || '—'} />
                </TwoColumnGrid>
              </Card>

              {/* Quotation Details - Remove ProductsTable from here */}
              <Card title="Quotation Details">
                <TwoColumnGrid>
                  <InfoRow label="Quotation Amount" value={quotation.grand_total ? `INR ${Number(quotation.grand_total).toLocaleString('en-IN')}/-` : null} />
                  <InfoRow label="Quotation Number" value={quotation.quotation_number} />
                  <InfoRow label="Quotation Date" value={quotation.created_at?.slice(0, 10)} />
                  <InfoRow label="Valid Till" value={quotation.valid_till_date || quotation.expires_at || '—'} />
                </TwoColumnGrid>
              </Card>

              {/* Products Table - Separate section with more spacing */}
              <div style={{ marginTop: 8 }}>
                <ProductsTable 
                  items={quotation.line_items}
                  totalAmount={quotation.total_amount}
                  taxAmount={quotation.tax_amount}
                  grandTotal={quotation.grand_total}
                />
              </div>
              {/* Attachments */}
              {quotation.attachments?.length > 0 && (
                <Card title={`Attached Files (${quotation.attachments.length})`}>
                  <FilesGrid attachments={quotation.attachments} />
                </Card>
              )}
            </div>
          )}

          {/* Tab: Terms */}
          {activeTab === 'terms' && (
            <CommercialTermsCard terms={quotation.terms} />
          )}

          {/* Tab: Follow Ups */}
          {activeTab === 'followups' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => setShowAddFollowUpModal(true)}
                  style={primaryBtn}
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
        </div>

   
            {/* RIGHT SIDEBAR - Controls - fixed width */}
            <div style={{ 
              width: 300, 
              flexShrink: 0,
              position: 'sticky',
              top: 20
            }}>

          {/* Review Status */}
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', padding: '16px 18px', marginBottom: 14 }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
              Review Status
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Badge status={reviewStatus} map={REVIEW_COLORS} />
              <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                {visibility === 'EXTERNAL' ? '(Visible)' : '(Internal)'}
              </span>
            </div>
            {reviewStatus === 'APPROVED' && (
              <div style={{ fontSize: '12px', color: '#43A047', background: '#EEFFEE', padding: '8px 12px', borderRadius: 6 }}>
                ✓ Ready to send to client
              </div>
            )}
            {reviewStatus === 'REJECTED' && (
              <div style={{ fontSize: '12px', color: '#E53935', background: '#FFF5F5', padding: '8px 12px', borderRadius: 6 }}>
                ✗ Rejected. Edit and resubmit.
              </div>
            )}
          </div>

          {/* Quote Age */}
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', padding: '16px 18px', marginBottom: 14 }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
              Quote Age
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, lineHeight: 1, color: quoteDays > 14 ? '#ef4444' : quoteDays > 7 ? '#f59e0b' : '#122C41' }}>
              {quoteDays !== null ? quoteDays : '—'}
              <span style={{ fontSize: '13px', fontWeight: 400, color: '#9ca3af', marginLeft: 4 }}>days</span>
            </div>
            {quotation.created_at && (
              <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: 6 }}>
                Created: {new Date(quotation.created_at).toLocaleDateString('en-IN')}
              </div>
            )}
          </div>

          {/* Client Status */}
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', padding: '16px 18px', marginBottom: 14 }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
              Client Status
            </div>
            <div style={{ marginBottom: 12 }}>
              <Badge status={clientStatus} map={CLIENT_COLORS} />
            </div>
            {!isFinalized && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {canMarkNegotiating && (
                  <button onClick={() => handleClientAction('mark_negotiating')} disabled={!!clientActionLoading} style={{ ...smallBtn, borderColor: '#8E24AA', color: '#8E24AA', background: '#faf5ff' }}>
                    {clientActionLoading === 'mark_negotiating' ? '...' : 'Mark Negotiating'}
                  </button>
                )}
                {canAccept && (
                  <button onClick={() => handleClientAction('mark_accepted')} disabled={!!clientActionLoading} style={{ ...smallBtn, borderColor: '#43A047', color: '#43A047', background: '#f0fdf4' }}>
                    {clientActionLoading === 'mark_accepted' ? '...' : '✓ Mark Accepted'}
                  </button>
                )}
                {canRejectByClient && (
                  <button onClick={() => setShowRejectClient(true)} disabled={!!clientActionLoading} style={{ ...smallBtn, borderColor: '#ef4444', color: '#ef4444', background: '#fef2f2' }}>
                    Rejected by Client
                  </button>
                )}
              </div>
            )}
            {isFinalized && (
              <div style={{ marginTop: 8, fontSize: '12px', color: clientStatus === 'ACCEPTED' ? '#43A047' : '#E53935' }}>
                {clientStatus === 'ACCEPTED' ? '✓ Accepted' : '✗ Rejected'}
                {quotation.po_number && clientStatus === 'ACCEPTED' && <span> • PO: {quotation.po_number}</span>}
              </div>
            )}
          </div>

          {/* Set Priority */}
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', padding: '16px 18px', marginBottom: 14 }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
              Priority
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 8 }}>
              {PRIORITY_ORDER.map(p => {
                const isActive = priority === p
                return (
                  <button key={p} onClick={() => !savingPriority && handleSetPriority(p)} disabled={savingPriority}
                    title={PRIORITY_LABELS[p]}
                    style={{ background: 'none', border: 'none', cursor: savingPriority ? 'wait' : 'pointer', padding: 4, borderRadius: 5, opacity: isActive ? 1 : 0.35, transform: isActive ? 'scale(1.15)' : 'scale(1)', transition: 'all 0.15s' }}>
                    <FlagIcon active={true} color={PRIORITY_COLORS[p]} size={22} />
                  </button>
                )
              })}
            </div>
            <div style={{ fontSize: '12px', color: '#4B5563' }}>
              Current: <span style={{ fontWeight: 700, color: PRIORITY_COLORS[priority] }}>{PRIORITY_LABELS[priority]}</span>
            </div>
          </div>

          {/* Assign To */}
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', padding: '16px 18px', marginBottom: 14 }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
              Assigned To
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <select 
                value={assignTo} 
                onChange={e => setAssignTo(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: 8,
                  fontSize: '13px',
                  fontFamily: 'Lato, sans-serif',
                  background: '#fff',
                }}
              >
                <option value="">— Unassigned —</option>
                {employees.map(emp => {
                  const eid = String(resolveEmpId(emp))
                  const ename = resolveEmpName(emp) || eid
                  return <option key={eid} value={eid}>{ename}</option>
                })}
              </select>
              <button 
                onClick={handleAssign}
                disabled={savingAssign || !assignTo || assignTo === String(quotation.assigned_to_id || '')}
                style={{
                  padding: '9px',
                  border: 'none',
                  borderRadius: 7,
                  background: (savingAssign || !assignTo || assignTo === String(quotation.assigned_to_id || '')) ? '#F3F4F6' : '#122C41',
                  color: (savingAssign || !assignTo || assignTo === String(quotation.assigned_to_id || '')) ? '#9ca3af' : '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'Lato, sans-serif'
                }}
              >
                {savingAssign ? 'Assigning...' : 'Confirm Assignment'}
              </button>
            </div>
          </div>

          {/* Quick Info */}
          <div style={{ background: '#F3F4F6', borderRadius: 10, border: '1px solid #e5e7eb', padding: '14px 16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#4B5563', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Quick Info
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <InfoRow label="Created By" value={quotation.enquiry_created_by || '—'} />
              <InfoRow label="Enquiry Date" value={quotation.enquiry_created_at ? new Date(quotation.enquiry_created_at).toLocaleDateString() : '—'} />
              <InfoRow label="Customer Tier" value={customer.tier || '—'} />
              <InfoRow label="Currency" value={quotation.enquiry_currency || 'INR'} />
              <InfoRow label="Valid Till" value={quotation.valid_till_date || quotation.expires_at || '—'} />
            </div>
          </div>
        </div>
      </div>

      {/* MODALS - unchanged from original */}
      <EditQuoteModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        quotation={quotation}
        onSuccess={handleEditSuccess}
      />

      {/* Approve Modal */}
      {showApproveModal && (
        <>
          <div onClick={() => setShowApproveModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#fff', borderRadius: 12, width: '90%', maxWidth: 400, zIndex: 1001, boxShadow: '0 20px 60px rgba(0,0,0,0.18)', padding: '28px' }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#122C41', marginBottom: 12 }}>Approve Quotation</div>
            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: 20 }}>
              Approve <strong>{quotation.quotation_number}</strong>? This will make it visible to employees.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowApproveModal(false)} style={outlineBtn}>Cancel</button>
              <button onClick={handleApprove} disabled={approvalLoading} style={{ ...primaryBtn, background: '#43A047' }}>
                {approvalLoading ? 'Approving...' : 'Approve'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <>
          <div onClick={() => setShowRejectModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#fff', borderRadius: 12, width: '90%', maxWidth: 440, zIndex: 1001, boxShadow: '0 20px 60px rgba(0,0,0,0.18)', padding: '28px' }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#122C41', marginBottom: 12 }}>Reject Quotation</div>
            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: 16 }}>Provide a reason:</div>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Reason for rejection"
              rows={3}
              style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 7, fontSize: '13px', outline: 'none', resize: 'vertical', marginBottom: 20 }}
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowRejectModal(false)} style={outlineBtn}>Cancel</button>
              <button onClick={handleReject} disabled={approvalLoading} style={{ ...outlineBtn, borderColor: '#ef4444', color: '#ef4444', background: '#fef2f2' }}>
                {approvalLoading ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Reject by Client Modal */}
      {showRejectClient && (
        <>
          <div onClick={() => setShowRejectClient(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#fff', borderRadius: 12, width: '90%', maxWidth: 440, zIndex: 1001, boxShadow: '0 20px 60px rgba(0,0,0,0.18)', padding: '28px' }}>
            <div style={{ fontSize: '17px', fontWeight: 700, color: '#122C41', marginBottom: 12 }}>Mark as Rejected by Client</div>
            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: 16 }}>Optional reason:</div>
            <textarea
              value={rejectRemark} onChange={e => setRejectRemark(e.target.value)}
              placeholder="Reason for rejection (optional)" rows={3}
              style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 7, fontSize: '13px', outline: 'none', resize: 'vertical', marginBottom: 20 }}
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowRejectClient(false)} style={outlineBtn}>Cancel</button>
              <button onClick={() => handleClientAction('mark_rejected', { remark: rejectRemark })} disabled={!!clientActionLoading} style={{ ...outlineBtn, borderColor: '#ef4444', color: '#ef4444', background: '#fef2f2' }}>
                {clientActionLoading === 'mark_rejected' ? 'Saving...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* PO Number Modal */}
      {showPOModal && (
        <>
          <div onClick={() => setShowPOModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#fff', borderRadius: 12, width: '90%', maxWidth: 560, zIndex: 1001, boxShadow: '0 24px 80px rgba(0,0,0,0.22)' }}>
            <div style={{ padding: '20px 28px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: '18px', color: '#122C41' }}>PO Number</span>
              <button onClick={() => setShowPOModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
              </button>
            </div>
            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: 8 }}>Quotation Number</div>
                <input readOnly value={quotation.quotation_number}
                  style={{ width: '100%', padding: '11px 14px', border: '2px solid #122C41', borderRadius: 7, fontSize: '14px', fontWeight: 600, color: '#122C41', background: '#f9fafb' }} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: 8 }}>PO Number</div>
                <textarea
                  value={poNumber}
                  onChange={e => setPoNumber(e.target.value)}
                  placeholder="Enter Purchase Order Number"
                  rows={3}
                  style={{ width: '100%', padding: '11px 14px', border: '1px solid #d1d5db', borderRadius: 7, fontSize: '13px', resize: 'vertical' }}
                />
              </div>
            </div>
            <div style={{ padding: '16px 28px', borderTop: '1px solid #f0f0f0' }}>
              {oaBlockMsg && (
                <div style={{ marginBottom: 12, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 7, fontSize: '13px', color: '#b91c1c' }}>
                  {oaBlockMsg}
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => { setShowPOModal(false); setOaBlockMsg('') }} style={outlineBtn}>Back</button>
                <button onClick={handleSavePO} disabled={savingPO || !poNumber.trim()} style={{ ...outlineBtn, borderColor: '#1E88E5', color: '#1E88E5', background: '#EEF5FF' }}>
                  {savingPO ? 'Saving...' : 'Save PO'}
                </button>
                <button onClick={handleGenerateOA} disabled={savingPO || !poNumber.trim()} style={{ ...primaryBtn, background: (savingPO || !poNumber.trim()) ? '#94a3b8' : '#122C41' }}>
                  Generate OA
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Add Follow Up Modal */}
      {showAddFollowUpModal && (
        <>
          <div onClick={() => setShowAddFollowUpModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#fff', borderRadius: 12, width: '90%', maxWidth: 520, zIndex: 1001, boxShadow: '0 24px 80px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '20px 28px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: '18px', color: '#122C41' }}>Add Follow Up</span>
              <button onClick={() => setShowAddFollowUpModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
              </button>
            </div>
            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: 6 }}>Follow Up Date *</div>
                <input type="date" value={newFollowUp.follow_up_date} onChange={e => setNewFollowUp({...newFollowUp, follow_up_date: e.target.value})}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 7, fontSize: '13px' }} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: 6 }}>Contact Person</div>
                <input type="text" value={newFollowUp.contact_person} onChange={e => setNewFollowUp({...newFollowUp, contact_person: e.target.value})}
                  placeholder="Contact person name"
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 7, fontSize: '13px' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: 6 }}>Contact Phone</div>
                  <input type="text" value={newFollowUp.contact_phone} onChange={e => setNewFollowUp({...newFollowUp, contact_phone: e.target.value})}
                    placeholder="Phone"
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 7, fontSize: '13px' }} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: 6 }}>Contact Email</div>
                  <input type="email" value={newFollowUp.contact_email} onChange={e => setNewFollowUp({...newFollowUp, contact_email: e.target.value})}
                    placeholder="Email"
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 7, fontSize: '13px' }} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: 6 }}>Remarks</div>
                <textarea value={newFollowUp.remarks} onChange={e => setNewFollowUp({...newFollowUp, remarks: e.target.value})}
                  placeholder="Remarks or notes" rows={3}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 7, fontSize: '13px', resize: 'vertical' }} />
              </div>
            </div>
            <div style={{ padding: '16px 28px', borderTop: '1px solid #f0f0f0', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAddFollowUpModal(false)} style={outlineBtn}>Cancel</button>
              <button onClick={handleAddFollowUp} disabled={addingFollowUp} style={{ ...primaryBtn, background: addingFollowUp ? '#94a3b8' : '#122C41' }}>
                {addingFollowUp ? 'Adding...' : 'Add Follow Up'}
              </button>
            </div>
          </div>
        </>
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  )
}

const outlineBtn = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: 7, background: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: '#374151', fontFamily: 'Lato, sans-serif' }
const primaryBtn = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: 'none', borderRadius: 7, background: '#122C41', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: '#fff', fontFamily: 'Lato, sans-serif' }
const smallBtn = { width: '100%', padding: '8px 12px', border: '1px solid', borderRadius: 6, fontSize: '12px', fontWeight: 500, cursor: 'pointer', background: '#fff', fontFamily: 'Lato, sans-serif' }