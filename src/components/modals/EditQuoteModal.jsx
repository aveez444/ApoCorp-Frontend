import { useState, useRef, useEffect } from 'react'
import api from '../../api/axios'
import AddProductsModal from "../../components/modals/AddProductsModal"

// ─── Shared input styles ───────────────────────────────────────────────────────
const inputStyle = { border: '1px solid #d1d5db', borderRadius: 6, padding: '11px 14px', fontSize: '13px', fontFamily: 'Lato, sans-serif', color: '#232323', outline: 'none', background: '#fff', width: '100%', boxSizing: 'border-box' }
const readonlyInput = { ...inputStyle, background: '#f9fafb', color: '#6b7280', cursor: 'default' }
const selectStyle = { ...inputStyle, appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: 32, cursor: 'pointer' }
const outlineBtn = { display: 'flex', alignItems: 'center', gap: 6, padding: '9px 22px', border: '1px solid #d1d5db', borderRadius: 7, background: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: '#374151', fontFamily: 'Lato, sans-serif' }
const primaryBtn = { display: 'flex', alignItems: 'center', gap: 6, padding: '9px 22px', border: 'none', borderRadius: 7, background: '#122C41', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: '#fff', fontFamily: 'Lato, sans-serif' }
const tdS = { padding: '9px 10px', fontSize: '12px', fontFamily: 'Lato, sans-serif', color: '#232323', whiteSpace: 'nowrap' }

function FL({ label, children }) {
  return (
    <div style={{ position: 'relative' }}>
      <span style={{ position: 'absolute', top: -9, left: 10, background: '#fff', padding: '0 4px', fontSize: '11px', color: '#6b7280', fontFamily: 'Lato, sans-serif', zIndex: 1, pointerEvents: 'none' }}>{label}</span>
      {children}
    </div>
  )
}

function FLgray({ label, children }) {
  return (
    <div style={{ position: 'relative' }}>
      <span style={{ position: 'absolute', top: -9, left: 10, background: '#f9fafb', padding: '0 4px', fontSize: '11px', color: '#6b7280', fontFamily: 'Lato, sans-serif', zIndex: 1, pointerEvents: 'none' }}>{label}</span>
      {children}
    </div>
  )
}

function formatINR(n) { if (!n) return '0'; return Number(n).toLocaleString('en-IN') }

function numToWords(n) {
  if (!n || isNaN(n)) return ''
  const num = Math.round(Number(n))
  if (num === 0) return 'Zero'
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen']
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety']
  function conv(n) {
    if (n < 20) return ones[n]
    if (n < 100) return tens[Math.floor(n/10)] + (n%10 ? ' '+ones[n%10] : '')
    if (n < 1000) return ones[Math.floor(n/100)]+' Hundred'+(n%100?' '+conv(n%100):'')
    if (n < 100000) return conv(Math.floor(n/1000))+' Thousand'+(n%1000?' '+conv(n%1000):'')
    if (n < 10000000) return conv(Math.floor(n/100000))+' Lakh'+(n%100000?' '+conv(n%100000):'')
    return conv(Math.floor(n/10000000))+' Crore'+(n%10000000?' '+conv(n%10000000):'')
  }
  return conv(num)+' Only'
}

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepIndicator({ step, onStepChange }) {
  const steps = [
    { n:1, label:['Customer','Details'] }, 
    { n:2, label:['Quotation','Details'] }
  ]
  
  const handleStepClick = (clickedStep) => {
    if (clickedStep === 1) {
      onStepChange(1)
    } else if (clickedStep === 2) {
      // Optional: Add validation before moving to step 2
      onStepChange(2)
    }
  }
  
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', marginBottom:24 }}>
      {steps.map((s,i) => (
        <div key={s.n} style={{ display:'flex', alignItems:'center' }}>
          <div 
            onClick={() => handleStepClick(s.n)}
            style={{ 
              display:'flex', 
              flexDirection:'column', 
              alignItems:'center', 
              gap:5,
              cursor: 'pointer',
            }}
          >
            <div style={{ 
              width:38, height:38, borderRadius:'50%', 
              background: step>s.n?'#fff':step===s.n?'#122C41':'#fff', 
              border:`2px solid ${step>=s.n?'#122C41':'#d1d5db'}`, 
              display:'flex', alignItems:'center', justifyContent:'center', 
              color: step===s.n?'#fff':step>s.n?'#122C41':'#9ca3af', 
              fontWeight:700, fontSize:'15px', fontFamily:'Lato, sans-serif',
              transition: 'all 0.2s ease',
            }}>
              {step>s.n ? <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg> : s.n}
            </div>
            <div style={{ textAlign:'center' }}>
              {s.label.map(l=><div key={l} style={{ fontSize:'10px', fontWeight:700, color:step===s.n?'#122C41':'#9ca3af', fontFamily:'Lato, sans-serif', lineHeight:1.3 }}>{l}</div>)}
            </div>
          </div>
          {i < steps.length-1 && <div style={{ width:100, height:2, background:step>s.n?'#122C41':'#d1d5db', margin:'0 6px', marginBottom:22 }} />}
        </div>
      ))}
    </div>
  )
}

// ─── MAIN EDIT MODAL ──────────────────────────────────────────────────────────
export default function EditQuoteModal({ open, onClose, quotation, onSuccess }) {
  const fileRef = useRef()
  const [step, setStep] = useState(1)
  const [activeTab, setActiveTab] = useState('products')
  const [showProductModal, setShowProductModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [cust, setCust] = useState({})
  const [currency, setCurrency] = useState('INR')
  const [lineItems, setLineItems] = useState([])
  const [terms, setTerms] = useState({})
  const [followUps, setFollowUps] = useState([])
  const [files, setFiles] = useState([])
  const [existingAttachments, setExistingAttachments] = useState([])

  // Pre-fill from quotation whenever modal opens
  useEffect(() => {
    if (!open || !quotation) return
    
    const fetchCustomerDetails = async () => {
      try {
        // First, fetch the enquiry to get the customer ID
        const enquiryResponse = await api.get(`/enquiries/${quotation.enquiry}/`)
        const customerId = enquiryResponse.data.customer
        
        // Then fetch customer details using the customer ID
        const customerResponse = await api.get(`/customers/${customerId}/`)
        const customerData = customerResponse.data
        
        // Find billing/shipping addresses if they exist
        const billingAddress = customerData.addresses?.find(addr => addr.address_type === 'BILLING') || {}
        const shippingAddress = customerData.addresses?.find(addr => addr.address_type === 'SHIPPING') || {}
        
        setCust({
          entity_name: customerData.company_name || '',
          contact_person: customerData.pocs?.find(poc => poc.is_primary)?.name || customerData.pocs?.[0]?.name || '',
          email: customerData.email || '',
          phone_landline: customerData.telephone_secondary || '',
          phone_mobile: customerData.telephone_primary || '',
          country: billingAddress.country || shippingAddress.country || customerData.country || '',
          city: billingAddress.city || shippingAddress.city || customerData.city || '',
          state: billingAddress.state || shippingAddress.state || customerData.state || '',
          address: billingAddress.address_line || shippingAddress.address_line || '',
        })
      } catch (error) {
        console.error('Failed to fetch customer details:', error)
        // Fallback to empty customer data
        setCust({
          entity_name: '', contact_person: '', email: '',
          phone_landline: '', phone_mobile: '',
          country: '', city: '', state: '', address: ''
        })
      }
    }

    fetchCustomerDetails()
    
    setStep(1)
    setActiveTab('products')
    setFiles([])
    setCurrency(quotation.currency || 'INR')

    // Map existing line items
    setLineItems((quotation.line_items || []).map(item => ({
      _productId: item.product || null,  // Internal ref
      product: item.product || null,     // FK
      job_code: item.job_code || '',
      customer_part_no: item.customer_part_no || '',
      part_no: item.part_no || '',
      product_name_snapshot: item.product_name_snapshot || '',
      description_snapshot: item.description_snapshot || '',
      hsn_snapshot: item.hsn_snapshot || '',
      unit_snapshot: item.unit_snapshot || 'NOS',
      quantity: item.quantity || '',
      unit_price: item.unit_price || '',
      tax_percent: Number(item.tax_percent) || 18,
      tax_group_code: item.tax_group_code || 'GST 18%',
      line_total: Number(item.line_total) || 0,
      tax_amount: Number(item.tax_amount) || 0,
    })))

    // Pre-fill terms
    const t = quotation.terms || {}
    setTerms({
      payment_terms: t.payment_terms || '',
      sales_tax: t.sales_tax || '',
      sup_charges: t.sup_charges || '',
      excise_duty: t.excise_duty || '',
      price_basis: t.price_basis || '',
      freight: t.freight || '',
      warranty: t.warranty || '',
      insurance: t.insurance || '',
      delivery: t.delivery || '',
      packing_forwarding: t.packing_forwarding || '',
      validity: t.validity || '',
      decision_expected: t.decision_expected || '',
      remarks: t.remarks || '',
    })

    setFollowUps((quotation.follow_ups || []).map(fu => ({
      follow_up_date: fu.follow_up_date || '',
      contact_person: fu.contact_person || '',
      contact_phone: fu.contact_phone || '',
      contact_email: fu.contact_email || '',
      remarks: fu.remarks || '',
    })))

    setExistingAttachments(quotation.attachments || [])
  }, [open, quotation])

  if (!open || !quotation) return null

  const totalOrderValue = lineItems.reduce((s, i) => s + (Number(i.line_total) || 0), 0)
  const totalTax = lineItems.reduce((s, i) => s + (Number(i.tax_amount) || 0), 0)
  const grandTotal = totalOrderValue + totalTax

  const handleStepChange = (newStep) => {setStep(newStep)}

  const addFollowUp = () => setFollowUps(p => [...p, { 
    follow_up_date: '', 
    contact_person: '', 
    contact_phone: '', 
    contact_email: '', 
    remarks: '' 
  }])
  const setFU = (i,k,v) => setFollowUps(p => p.map((fu,idx) => idx===i ? {...fu,[k]:v} : fu))
  const removeFU = i => setFollowUps(p => p.filter((_,idx) => idx!==i))
  const handleFileAdd = e => { 
  const newFiles = Array.from(e.target.files)
  console.log('Adding files to edit modal:', newFiles) // Debug log
  setFiles(prev => [...prev, ...newFiles])
  e.target.value = '' // Reset input
 }
  const removeFile = i => setFiles(p => p.filter((_,idx) => idx!==i))
  
  // Delete a single line item
  const handleDeleteItem = (index) => {
    setLineItems(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (lineItems.length === 0) { alert('Add at least one product'); return }
    setSubmitting(true)
    try {
      const wasApproved = quotation.review_status === 'APPROVED'
      
      // Build payload with only changed fields
      const payload = {}
      
      // Only include currency if it changed
      if (currency !== quotation.currency) {
        payload.currency = currency
      }
      
      // Always include follow_ups (they're always sent)
      payload.follow_ups = followUps.filter(fu => fu.follow_up_date).map(fu => ({
        follow_up_date: fu.follow_up_date,
        contact_person: fu.contact_person || '',
        contact_phone: fu.contact_phone || '',
        contact_email: fu.contact_email || '',
        remarks: fu.remarks || '',
      }))
      
      // Only include line_items if they changed (compare with original)
      const originalLineItems = quotation.line_items || []
      const lineItemsChanged = JSON.stringify(lineItems.map(item => ({
        ...item,
        line_total: undefined,
        tax_amount: undefined,
      }))) !== JSON.stringify(originalLineItems.map(item => ({
        ...item,
        line_total: undefined,
        tax_amount: undefined,
      })))
      
      if (lineItemsChanged) {
        payload.line_items = lineItems.map(item => ({
          job_code: item.job_code || '',
          customer_part_no: item.customer_part_no || '',
          part_no: item.part_no || '',
          product_name_snapshot: item.product_name_snapshot,
          description_snapshot: item.description_snapshot || '',
          hsn_snapshot: item.hsn_snapshot || '',
          unit_snapshot: item.unit_snapshot || 'NOS',
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
          tax_percent: Number(item.tax_percent) || 0,
          tax_group_code: item.tax_group_code || '',
        }))
      }
      
      // Only include terms if they changed
      const originalTerms = quotation.terms || {}
      const termsChanged = JSON.stringify(terms) !== JSON.stringify(originalTerms)
      if (termsChanged) {
        payload.terms = { ...terms }
      }
      
      // Only send PATCH if there are changes to non-file fields
      if (Object.keys(payload).length > 0) {
        await api.patch(`/quotations/${quotation.id}/`, payload)
      }
      
      // Upload new files using the upload_file endpoint
      if (files.length > 0) {
        for (const file of files) {
          const formData = new FormData()
          formData.append('file', file)
          await api.post(`/quotations/${quotation.id}/upload_file/`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
        }
      }
      
      onSuccess?.({ quotationNumber: quotation.quotation_number, wasApproved })
      onClose()
    } catch (err) {
      const errData = err?.response?.data
      alert(errData ? JSON.stringify(errData) : 'Failed to update quotation')
    } finally {
      setSubmitting(false)
    }
  }

  const sectionTitle = { fontSize:'14px', fontWeight:700, color:'#122C41', fontFamily:'Lato, sans-serif', marginBottom:16 }

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:1000 }} />

      {/* Add Products Modal */}
      {showProductModal && (
        <AddProductsModal
          open={showProductModal}
          onClose={() => setShowProductModal(false)}
          initialItems={lineItems}
          onSave={items => {
            setLineItems(items)
            setShowProductModal(false)
          }}
          currency={currency}
        />
      )}

      <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', background:'#fff', borderRadius:12, width:'92%', maxWidth:940, maxHeight:'92vh', display:'flex', flexDirection:'column', zIndex:1001, fontFamily:'Lato, sans-serif', boxShadow:'0 24px 80px rgba(0,0,0,0.2)' }}>
        {/* Header */}
        <div style={{ padding:'20px 28px 16px', borderBottom:'1px solid #f0f0f0', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div>
            <span style={{ fontWeight:700, fontSize:'18px', color:'#122C41' }}>Edit Quotation</span>
            <span style={{ marginLeft:12, fontSize:'13px', color:'#6b7280', fontFamily:'Lato, sans-serif' }}>{quotation.quotation_number}</span>
            {quotation.review_status === 'APPROVED' && (
              <span style={{ marginLeft:10, fontSize:'11px', background:'#FFF8E1', color:'#F59E0B', border:'1px solid #F59E0B44', borderRadius:20, padding:'2px 10px', fontWeight:600 }}>
                ⚠ Editing approved quote — will reset to Under Review
              </span>
            )}
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#6b7280' }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ flex:1, overflowY:'auto', padding:'20px 28px' }}>
         <StepIndicator step={step} onStepChange={handleStepChange} />

        {/* Step 1: Customer Details */}
        {step === 1 && (
          <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
            <div>
              <div style={sectionTitle}>Enquiry No. &amp; Quotation Number</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:14, alignItems:'center' }}>
                <FLgray label="Enquiry Number"><input style={readonlyInput} value={quotation.enquiry_number || '—'} readOnly /></FLgray>
                <div style={{ display:'flex', alignItems:'center', marginBottom:2 }}>
                  <svg width="60" height="12" viewBox="0 0 60 12"><line x1="0" y1="6" x2="54" y2="6" stroke="#122C41" strokeWidth="1.5" strokeDasharray="5,3"/><path d="M54 2L60 6L54 10" fill="none" stroke="#122C41" strokeWidth="1.5"/></svg>
                </div>
                <FLgray label="Quotation Number"><input style={readonlyInput} value={quotation.quotation_number} readOnly /></FLgray>
              </div>
            </div>
            <div>
              <div style={sectionTitle}>Customer Details</div>
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                  <FLgray label="Entity Name"><input style={readonlyInput} value={cust.entity_name} readOnly /></FLgray>
                  <FLgray label="Contact Person"><input style={readonlyInput} value={cust.contact_person} readOnly /></FLgray>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
                  <FLgray label="Email ID"><input style={readonlyInput} value={cust.email} readOnly /></FLgray>
                  <FLgray label="Phone (Landline)"><input style={readonlyInput} value={cust.phone_landline} readOnly /></FLgray>
                  <FLgray label="Phone (Mobile)"><input style={readonlyInput} value={cust.phone_mobile} readOnly /></FLgray>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
                  <FLgray label="Country"><input style={readonlyInput} value={cust.country} readOnly /></FLgray>
                  <FLgray label="City"><input style={readonlyInput} value={cust.city} readOnly /></FLgray>
                  <FLgray label="State"><input style={readonlyInput} value={cust.state} readOnly /></FLgray>
                </div>
                <FLgray label="Detailed Address">
                  <textarea style={{ ...readonlyInput, resize:'none', minHeight:72 }} value={cust.address} readOnly />
                </FLgray>
              </div>
            </div>
          </div>
        )}

          {/* Step 2: Quotation Details */}
          {step === 2 && (
            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
              <div>
                <div style={sectionTitle}>Enquiry No. &amp; Quotation Number</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:14, alignItems:'center' }}>
                  <FLgray label="Enquiry Number"><input style={readonlyInput} value={quotation.enquiry_number || '—'} readOnly /></FLgray>
                  <div style={{ display:'flex', alignItems:'center', marginBottom:2 }}>
                    <svg width="60" height="12" viewBox="0 0 60 12"><line x1="0" y1="6" x2="54" y2="6" stroke="#122C41" strokeWidth="1.5" strokeDasharray="5,3"/><path d="M54 2L60 6L54 10" fill="none" stroke="#122C41" strokeWidth="1.5"/></svg>
                  </div>
                  <FLgray label="Quotation Number"><input style={readonlyInput} value={quotation.quotation_number} readOnly /></FLgray>
                </div>
              </div>

              <div>
                <div style={sectionTitle}>Quotation Details</div>
                {/* Tabs */}
                <div style={{ display:'flex', gap:0, borderBottom:'1px solid #e5e7eb', marginBottom:20 }}>
                  {[['products','Product Details'],['terms','Commercial Terms'],['followup','Follow Up'],['files','Files']].map(([key,label]) => (
                    <button key={key} onClick={()=>setActiveTab(key)} style={{ padding:'10px 16px', background:'none', border:'none', cursor:'pointer', fontFamily:'Lato, sans-serif', fontSize:'13px', fontWeight:activeTab===key?700:500, color:activeTab===key?'#122C41':'#6b7280', borderBottom:activeTab===key?'2px solid #122C41':'2px solid transparent', marginBottom:-1, whiteSpace:'nowrap' }}>
                      {label}
                    </button>
                  ))}
                </div>

                {/* Product Details tab */}
                {activeTab === 'products' && (
                  <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                      <div style={{ width:160 }}>
                        <FL label="Currency">
                          <select style={selectStyle} value={currency} onChange={e=>setCurrency(e.target.value)}>
                            <option value="INR">INR (₹)</option><option value="USD">USD ($)</option><option value="EUR">EUR (€)</option>
                          </select>
                        </FL>
                      </div>
                      <div style={{ width:200 }}>
                        <FL label="Total Value"><input style={readonlyInput} readOnly value={grandTotal ? `${currency} ${formatINR(grandTotal)}` : `${currency} 0`} /></FL>
                      </div>
                      <div style={{ marginLeft:'auto' }}>
                        <button onClick={() => setShowProductModal(true)} style={{ ...primaryBtn, gap:6 }}>
                          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                          Manage Products
                        </button>
                      </div>
                    </div>
                    {lineItems.length > 0 ? (
                      <div style={{ border:'1px solid #e5e7eb', borderRadius:8, overflow:'hidden' }}>
                        <table style={{ width:'100%', borderCollapse:'collapse', minWidth:700 }}>
                          <thead>
                            <tr style={{ background:'#122C41' }}>
                              {['Job Code','Cust. Part No','Part No.','Description','HSN','Qty','Unit','Unit Price','Total','Tax Group',''].map(h=>(
                                <th key={h} style={{ padding:'10px 10px', fontSize:'11px', fontWeight:700, color:'#fff', textAlign:'left', whiteSpace:'nowrap', fontFamily:'Lato, sans-serif' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {lineItems.map((item,i)=>(
                              <tr key={i} style={{ borderBottom:'1px solid #f0f0f0', background:i%2===0?'#fafafa':'#fff' }}>
                                <td style={tdS}>{item.job_code||'—'}</td>
                                <td style={tdS}>{item.customer_part_no||'—'}</td>
                                <td style={tdS}>{item.part_no||'—'}</td>
                                <td style={{ ...tdS, maxWidth:120, overflow:'hidden', textOverflow:'ellipsis' }}>{item.product_name_snapshot}</td>
                                <td style={tdS}>{item.hsn_snapshot||'—'}</td>
                                <td style={tdS}>{item.quantity}</td>
                                <td style={tdS}>{item.unit_snapshot}</td>
                                <td style={tdS}>₹{formatINR(item.unit_price)}</td>
                                <td style={tdS}>₹{formatINR(item.line_total)}</td>
                                <td style={tdS}>{item.tax_group_code}</td>
                                <td style={{ padding:'8px 10px' }}>
                                  <button 
                                    onClick={() => handleDeleteItem(i)} 
                                    style={{ background:'none', border:'none', cursor:'pointer', color:'#ef4444' }}
                                    title="Delete item"
                                  >
                                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <polyline points="3 6 5 6 21 6" />
                                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                    </svg>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div style={{ border:'2px dashed #e5e7eb', borderRadius:8, padding:'36px', textAlign:'center', color:'#9ca3af', fontSize:'13px', fontFamily:'Lato, sans-serif' }}>No products yet. Click "Manage Products" to get started.</div>
                    )}
                    {lineItems.length > 0 && (
                      <div style={{ textAlign:'center', padding:'12px', background:'#f9fafb', borderRadius:8, border:'1px solid #e5e7eb' }}>
                        <span style={{ fontSize:'13px', fontWeight:600, color:'#122C41', fontFamily:'Lato, sans-serif' }}>
                          Total Order Value — {currency} {formatINR(totalOrderValue)} : {numToWords(totalOrderValue)}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Commercial Terms tab */}
                {activeTab === 'terms' && (
                  <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
                      <FL label="Payment Terms"><input style={inputStyle} value={terms.payment_terms||''} onChange={e=>setTerms(p=>({...p,payment_terms:e.target.value}))} /></FL>
                      <FL label="Sales Tax"><input style={inputStyle} value={terms.sales_tax||''} onChange={e=>setTerms(p=>({...p,sales_tax:e.target.value}))} /></FL>
                      <FL label="Sup Charges"><input style={inputStyle} value={terms.sup_charges||''} onChange={e=>setTerms(p=>({...p,sup_charges:e.target.value}))} /></FL>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
                      <FL label="Excise Duty"><input style={inputStyle} value={terms.excise_duty||''} onChange={e=>setTerms(p=>({...p,excise_duty:e.target.value}))} /></FL>
                      <FL label="Price Basis"><input style={inputStyle} value={terms.price_basis||''} onChange={e=>setTerms(p=>({...p,price_basis:e.target.value}))} /></FL>
                      <FL label="Freight"><input style={inputStyle} value={terms.freight||''} onChange={e=>setTerms(p=>({...p,freight:e.target.value}))} /></FL>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
                      <FL label="Warranty"><input style={inputStyle} value={terms.warranty||''} onChange={e=>setTerms(p=>({...p,warranty:e.target.value}))} /></FL>
                      <FL label="Insurance"><input style={inputStyle} value={terms.insurance||''} onChange={e=>setTerms(p=>({...p,insurance:e.target.value}))} /></FL>
                      <FL label="Delivery"><input style={inputStyle} value={terms.delivery||''} onChange={e=>setTerms(p=>({...p,delivery:e.target.value}))} /></FL>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
                      <FL label="Packaging &amp; Forward"><input style={inputStyle} value={terms.packing_forwarding||''} onChange={e=>setTerms(p=>({...p,packing_forwarding:e.target.value}))} /></FL>
                      <FL label="Validity"><input style={inputStyle} value={terms.validity||''} onChange={e=>setTerms(p=>({...p,validity:e.target.value}))} /></FL>
                      <FL label="Decision Expected"><input style={inputStyle} value={terms.decision_expected||''} onChange={e=>setTerms(p=>({...p,decision_expected:e.target.value}))} /></FL>
                    </div>
                    <FL label="Remark / Comments"><textarea style={{ ...inputStyle, resize:'vertical', minHeight:72 }} value={terms.remarks||''} onChange={e=>setTerms(p=>({...p,remarks:e.target.value}))} /></FL>
                  </div>
                )}

                {/* Follow Up tab */}
                {activeTab === 'followup' && (
                <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                  {followUps.length === 0 && <div style={{ color:'#9ca3af', fontSize:'13px', textAlign:'center', padding:'24px', fontFamily:'Lato, sans-serif' }}>No follow-ups added yet.</div>}
                  {followUps.map((fu,i)=>(
                    <div key={i} style={{ border:'1px solid #e5e7eb', borderRadius:10, padding:'16px 18px' }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                        <span style={{ fontSize:'13px', fontWeight:700, color:'#122C41', fontFamily:'Lato, sans-serif' }}>{i+1}{i===0?'st':i===1?'nd':i===2?'rd':'th'} Follow Up</span>
                        <button onClick={()=>removeFU(i)} style={{ background:'none', border:'none', cursor:'pointer', color:'#ef4444', fontSize:'12px', fontWeight:600, fontFamily:'Lato, sans-serif' }}>Remove Follow-Up</button>
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                          <FL label="Follow Up Date"><input type="date" style={inputStyle} value={fu.follow_up_date} onChange={e=>setFU(i,'follow_up_date',e.target.value)} /></FL>
                          <FL label="Contact Person"><input style={inputStyle} value={fu.contact_person} onChange={e=>setFU(i,'contact_person',e.target.value)} /></FL>
                        </div>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                          <FL label="Contact Phone"><input style={inputStyle} value={fu.contact_phone} onChange={e=>setFU(i,'contact_phone',e.target.value)} /></FL>
                          <FL label="Contact Email"><input style={inputStyle} value={fu.contact_email} onChange={e=>setFU(i,'contact_email',e.target.value)} /></FL>
                        </div>
                        <FL label="Remarks">
                          <textarea style={{ ...inputStyle, resize:'vertical', minHeight:72 }} value={fu.remarks} onChange={e=>setFU(i,'remarks',e.target.value)} />
                        </FL>
                      </div>
                    </div>
                  ))}
                  <button onClick={addFollowUp} style={{ display:'flex', alignItems:'center', gap:6, margin:'0 auto', background:'none', border:'1px dashed #122C41', borderRadius:8, padding:'9px 22px', cursor:'pointer', color:'#122C41', fontSize:'13px', fontWeight:600, fontFamily:'Lato, sans-serif' }}>
                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Add Follow-Up
                  </button>
                </div>
              )}

                {/* Files tab */}
                {activeTab === 'files' && (
                  <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                    {/* Existing attachments */}
                    {existingAttachments.length > 0 && (
                      <div>
                        <div style={{ fontSize:'12px', fontWeight:600, color:'#6b7280', marginBottom:8, fontFamily:'Lato, sans-serif' }}>Existing Files ({existingAttachments.length})</div>
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:8, marginBottom:16 }}>
                          {existingAttachments.map((att,i) => {
                            const fname = att.file?.split('/').pop()||`File ${i+1}`
                            const ext = fname.split('.').pop()?.toUpperCase()||'FILE'
                            return (
                              <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', border:'1px solid #e5e7eb', borderRadius:8, padding:'10px 14px', background:'#f9fafb' }}>
                                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#122C41" strokeWidth={2}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                  <div>
                                    <div style={{ fontSize:'12px', fontWeight:600, color:'#374151', fontFamily:'Lato, sans-serif' }}>{fname.length>20?fname.slice(0,20)+'…':fname}</div>
                                    <div style={{ fontSize:'11px', color:'#9ca3af', fontFamily:'Lato, sans-serif' }}>{ext} File</div>
                                  </div>
                                </div>
                                <a href={att.file} target="_blank" rel="noopener noreferrer" style={{ color:'#6b7280', display:'flex' }}>
                                  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                </a>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                    {/* New files */}
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <span style={{ fontSize:'13px', fontWeight:600, color:'#122C41', fontFamily:'Lato, sans-serif' }}>Add New Files ({files.length})</span>
                      <button onClick={()=>fileRef.current?.click()} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', border:'1px solid #d1d5db', borderRadius:6, background:'#fff', fontSize:'13px', fontWeight:500, cursor:'pointer', color:'#374151', fontFamily:'Lato, sans-serif' }}>
                        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.41 17.41a2 2 0 0 1-2.83-2.83l8.49-8.49" strokeLinecap="round"/></svg>
                        Attach Files
                      </button>
                      <input 
                        ref={fileRef} 
                        type="file" 
                        multiple 
                        style={{ display: 'none' }} 
                        onChange={handleFileAdd} 
                      />
                    </div>
                    {files.length === 0 && <div style={{ border:'2px dashed #e5e7eb', borderRadius:8, padding:'24px', textAlign:'center', color:'#9ca3af', fontSize:'13px', fontFamily:'Lato, sans-serif' }}>No new files added.</div>}
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:10 }}>
                      {files.map((f,i)=>(
                        <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', border:'1px solid #e5e7eb', borderRadius:8, padding:'10px 14px', background:'#EEF3FF' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#122C41" strokeWidth={2}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                            <div>
                              <div style={{ fontSize:'12px', fontWeight:600, color:'#122C41', fontFamily:'Lato, sans-serif' }}>{f.name.length>20?f.name.slice(0,20)+'…':f.name}</div>
                              <div style={{ fontSize:'11px', color:'#9ca3af', fontFamily:'Lato, sans-serif' }}>{(f.size/(1024*1024)).toFixed(1)} MB</div>
                            </div>
                          </div>
                          <button onClick={()=>removeFile(i)} style={{ background:'none', border:'none', cursor:'pointer', color:'#ef4444' }}>
                            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:'14px 28px', borderTop:'1px solid #f0f0f0', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'space-between', background:'#fff' }}>
          <div>
            {step === 2 && grandTotal > 0 && (
              <div>
                <div style={{ fontSize:'12px', color:'#6b7280', fontFamily:'Lato, sans-serif' }}>Quotation Amount :</div>
                <div style={{ fontSize:'15px', fontWeight:700, color:'#122C41', fontFamily:'Lato, sans-serif' }}>{currency} {formatINR(grandTotal)}/-</div>
                <div style={{ fontSize:'11px', color:'#6b7280', fontFamily:'Lato, sans-serif' }}>{numToWords(grandTotal)}</div>
              </div>
            )}
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={step===1?onClose:()=>setStep(1)} style={outlineBtn}>{step===1?'Cancel':'Back'}</button>
            {step === 1
              ? <button onClick={()=>setStep(2)} style={primaryBtn}>Next</button>
              : <button onClick={handleSubmit} disabled={submitting} style={{ ...primaryBtn, background:submitting?'#94a3b8':'#122C41', cursor:submitting?'not-allowed':'pointer' }}>
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
            }
          </div>
        </div>
      </div>
    </>
  )
}