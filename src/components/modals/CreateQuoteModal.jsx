import { useState, useRef, useEffect } from 'react'
import api from '../../api/axios'
import AddProductsModal from "../../components/modals/AddProductsModal"

const FONT = 'Lato, sans-serif'
const PRIMARY = '#122C41'

// ── Shared styles ──────────────────────────────────────────────────────────────
const inputStyle = {
  border: '1px solid #d1d5db', borderRadius: 6,
  padding: '11px 14px', fontSize: '13px',
  fontFamily: FONT, color: '#232323',
  outline: 'none', background: '#fff',
  width: '100%', boxSizing: 'border-box',
}

const readonlyStyle = {
  ...inputStyle,
  background: '#f9fafb', color: '#6b7280',
  cursor: 'default',
}

const selectStyle = {
  ...inputStyle,
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
  paddingRight: 32, cursor: 'pointer',
}

// Floating label wrapper — white bg for editable, gray bg for readonly
function FL({ label, children, gray }) {
  return (
    <div style={{ position: 'relative' }}>
      <span style={{
        position: 'absolute', top: -9, left: 10,
        background: gray ? '#f9fafb' : '#fff',
        padding: '0 4px', fontSize: '11px', color: '#6b7280',
        fontFamily: FONT, zIndex: 1, pointerEvents: 'none',
      }}>
        {label}
      </span>
      {children}
    </div>
  )
}

// ── Indian number-to-words ────────────────────────────────────────────────────
function numToWords(n) {
  if (!n || isNaN(n)) return ''
  const num = Math.round(Number(n))
  if (num === 0) return 'Zero'
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  const tensArr = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
  function convert(n) {
    if (n < 20) return ones[n]
    if (n < 100) return tensArr[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '')
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '')
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '')
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '')
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '')
  }
  return convert(num) + ' Only'
}

function formatINR(n) {
  if (!n) return '0'
  return Number(n).toLocaleString('en-IN')
}

// ── Step Indicator ─────────────────────────────────────────────────────────────

function StepIndicator({ step, onStepChange }) {
  const steps = [
    { n: 1, label: ['Customer', 'Details'] },
    { n: 2, label: ['Quotation', 'Details'] },
  ]
  
  const handleStepClick = (clickedStep) => {
    // Allow clicking on step 1 always
    // Allow clicking on step 2 only if we have a customer? You can add validation here
    if (clickedStep === 1) {
      onStepChange(1)
    } else if (clickedStep === 2) {
      // Optional: Add validation before moving to step 2
      onStepChange(2)
    }
  }
  
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', marginBottom: 24, gap: 0 }}>
      {steps.map((s, i) => {
        const done = step > s.n
        const active = step === s.n
        return (
          <div key={s.n} style={{ display: 'flex', alignItems: 'flex-start' }}>
            <div 
              onClick={() => handleStepClick(s.n)}
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: 6,
                cursor: 'pointer',
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: done ? '#fff' : active ? PRIMARY : '#fff',
                border: `2px solid ${done || active ? PRIMARY : '#d1d5db'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: active ? '#fff' : done ? PRIMARY : '#9ca3af',
                fontWeight: 700, fontSize: '14px', fontFamily: FONT,
                flexShrink: 0,
                transition: 'all 0.2s ease',
              }}>
                {done
                  ? <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  : s.n}
              </div>
              <div style={{ textAlign: 'center' }}>
                {s.label.map(l => (
                  <div key={l} style={{ fontSize: '10px', fontWeight: active ? 700 : 500, color: active ? PRIMARY : '#9ca3af', fontFamily: FONT, lineHeight: 1.4 }}>{l}</div>
                ))}
              </div>
            </div>
            {i < steps.length - 1 && (
              <div style={{ width: 90, height: 2, background: done ? PRIMARY : '#d1d5db', margin: '18px 6px 0', flexShrink: 0 }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── MAIN MODAL ────────────────────────────────────────────────────────────────
export default function CreateQuoteModal({ open, onClose, enquiry, onSuccess }) {
  const fileRef = useRef()
  const [step, setStep] = useState(1)
  const [activeTab, setActiveTab] = useState('products')
  const [showProductModal, setShowProductModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  

  // Customer snapshot — read from enquiry.customer_snapshot JSON field
  const [cust, setCust] = useState({})

  // Step 2
  const [currency, setCurrency] = useState('INR')
  const [lineItems, setLineItems] = useState([])
  const [terms, setTerms] = useState(defaultTerms())
  const [followUps, setFollowUps] = useState([])
  const [files, setFiles] = useState([])

  // Reset when modal opens — read from customer_snapshot
  useEffect(() => {
    if (!open || !enquiry) return

    const fetchCustomerDetails = async () => {
      try {
        // Fetch customer details using the customer ID from enquiry
        const response = await api.get(`/customers/${enquiry.customer}/`)
        const customerData = response.data
        
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
    
    // Reset other states
    setStep(1)
    setActiveTab('products')
    setLineItems([])
    setFollowUps([])
    setFiles([])
    setCurrency(enquiry.currency || 'INR')
    setTerms(defaultTerms())

    const cs = enquiry.customer_snapshot || {}
    setCust({
      entity_name:    cs.company_name || '',
      contact_person: cs.poc_name || cs.contact_person || '',
      email:          cs.email || '',
      phone_landline: cs.landline || cs.phone_landline || '',
      phone_mobile:   cs.phone || cs.phone_mobile || '',
      country:        cs.country || '',
      city:           cs.city || '',
      state:          cs.state || '',
      address:        cs.address || cs.detailed_address || '',
    })
  }, [open, enquiry])

  if (!open || !enquiry) return null

  const totalOrderValue = lineItems.reduce((s, i) => s + (Number(i.line_total) || 0), 0)
  const totalTax = lineItems.reduce((s, i) => s + (Number(i.tax_amount) || 0), 0)
  const grandTotal = totalOrderValue + totalTax

  // Follow-up helpers
  const addFollowUp = () => setFollowUps(p => [...p, { follow_up_date: '', contact_person: '', contact_phone: '', contact_email: '', remarks: '' }])
  const setFU = (i, k, v) => setFollowUps(p => p.map((fu, idx) => idx === i ? { ...fu, [k]: v } : fu))
  const removeFU = i => setFollowUps(p => p.filter((_, idx) => idx !== i))

  const handleStepChange = (newStep) => {setStep(newStep) }

  const handleFileAdd = e => { 
  const newFiles = Array.from(e.target.files)
  console.log('Adding files:', newFiles) // Debug log
  setFiles(prev => [...prev, ...newFiles])
  e.target.value = '' // Reset input
}

  // Add this removeFile function
  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, idx) => idx !== index))
  }

  const handleSubmit = async () => {
  if (lineItems.length === 0) { alert('Please add at least one product'); return }
  if (submitting) return
  setSubmitting(true)
  try {
    const payload = {
      enquiry: enquiry.id,
      customer: enquiry.customer,
      currency,
      line_items: lineItems.map(item => ({
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
      })),
      terms: { ...terms },
      follow_ups: followUps
        .filter(fu => fu.follow_up_date?.trim())
        .map(fu => ({
          follow_up_date: fu.follow_up_date,
          contact_person: fu.contact_person || '',
          contact_phone: fu.contact_phone || '',
          contact_email: fu.contact_email || '',
          remarks: fu.remarks || '',
        })),
    }

    // Create quotation first
    const createRes = await api.post('/quotations/', payload)
    const quotationData = createRes.data
    const quotationId = quotationData.id || quotationData.uuid || quotationData.quotation_id

    if (!quotationId) throw new Error('No id found in create response')

    // Upload files using the upload_file endpoint
    if (files.length > 0) {
      for (const file of files) {
        try {
          const fd = new FormData()
          fd.append('file', file)
          await api.post(`/quotations/${quotationId}/upload_file/`, fd, { 
            headers: { 'Content-Type': 'multipart/form-data' } 
          })
        } catch (uploadErr) {
          console.error(`Upload failed for ${file.name}:`, uploadErr?.response?.data || uploadErr)
          // Continue with other files even if one fails
        }
      }
    }

    onSuccess?.({ 
      quotationNumber: quotationData.quotation_number, 
      enquiryNumber: enquiry.enquiry_number, 
      quotationId 
    })
    onClose()
  } catch (err) {
    const msg = err?.response?.data?.detail || err?.response?.data?.non_field_errors?.[0] || err.message || 'Failed to create quotation'
    alert(msg)
  } finally {
    setSubmitting(false)
  }
}

  // Delete a single line item
  const handleDeleteItem = (index) => {
    setLineItems(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(10,20,35,0.45)', zIndex: 1000 }} />

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

      {/* Main modal */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        background: '#fff', borderRadius: 14,
        width: '92%', maxWidth: 920,
        maxHeight: '92vh',
        display: 'flex', flexDirection: 'column',
        zIndex: 1001, fontFamily: FONT,
        boxShadow: '0 24px 80px rgba(0,0,0,0.22)',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 28px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ fontWeight: 700, fontSize: '18px', color: PRIMARY, fontFamily: FONT }}>Create Internal Quote</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex' }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" /></svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
           <StepIndicator step={step} onStepChange={handleStepChange} />

          {/* ── STEP 1: Customer Details ── */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

              {/* Enquiry # ↔ Quotation # */}
              <div>
                <div style={sectionTitle}>Enquiry No. & Quotation Number</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 14, alignItems: 'center' }}>
                  <FL label="Enquiry Number" gray>
                    <input style={readonlyStyle} value={enquiry.enquiry_number} readOnly />
                  </FL>
                  <div style={{ display: 'flex', alignItems: 'center', paddingBottom: 2 }}>
                    <svg width="60" height="12" viewBox="0 0 60 12">
                      <line x1="0" y1="6" x2="54" y2="6" stroke={PRIMARY} strokeWidth="1.5" strokeDasharray="5,3" />
                      <path d="M54 2L60 6L54 10" fill="none" stroke={PRIMARY} strokeWidth="1.5" />
                    </svg>
                  </div>
                  <FL label="Quotation Number" gray>
                    <input style={readonlyStyle} value="Auto-generated" readOnly />
                  </FL>
                </div>
              </div>

              {/* Customer Details — all read-only, pre-filled from snapshot */}
              <div>
                <div style={sectionTitle}>Customer Details</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <FL label="Entity Name" gray>
                      <input style={readonlyStyle} value={cust.entity_name} readOnly />
                    </FL>
                    <FL label="Contact Person" gray>
                      <input style={readonlyStyle} value={cust.contact_person} readOnly />
                    </FL>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                    <FL label="Email ID" gray>
                      <input style={readonlyStyle} value={cust.email} readOnly />
                    </FL>
                    <FL label="Phone (Landline)" gray>
                      <input style={readonlyStyle} value={cust.phone_landline} readOnly />
                    </FL>
                    <FL label="Phone (Mobile)" gray>
                      <input style={readonlyStyle} value={cust.phone_mobile} readOnly />
                    </FL>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                    <FL label="Country" gray>
                      <input style={readonlyStyle} value={cust.country} readOnly />
                    </FL>
                    <FL label="City" gray>
                      <input style={readonlyStyle} value={cust.city} readOnly />
                    </FL>
                    <FL label="State" gray>
                      <input style={readonlyStyle} value={cust.state} readOnly />
                    </FL>
                  </div>
                  <FL label="Detailed Address" gray>
                    <textarea style={{ ...readonlyStyle, resize: 'none', minHeight: 72 }} value={cust.address} readOnly />
                  </FL>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: Quotation Details ── */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

              {/* Enquiry # recap */}
              <div>
                <div style={sectionTitle}>Enquiry No. & Quotation Number</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 14, alignItems: 'center' }}>
                  <FL label="Enquiry Number" gray><input style={readonlyStyle} value={enquiry.enquiry_number} readOnly /></FL>
                  <div style={{ display: 'flex', alignItems: 'center', paddingBottom: 2 }}>
                    <svg width="60" height="12" viewBox="0 0 60 12">
                      <line x1="0" y1="6" x2="54" y2="6" stroke={PRIMARY} strokeWidth="1.5" strokeDasharray="5,3" />
                      <path d="M54 2L60 6L54 10" fill="none" stroke={PRIMARY} strokeWidth="1.5" />
                    </svg>
                  </div>
                  <FL label="Quotation Number" gray><input style={readonlyStyle} value="Auto-generated" readOnly /></FL>
                </div>
              </div>

              {/* Tabs */}
              <div>
                <div style={sectionTitle}>Quotation Details</div>
                <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #e5e7eb', marginBottom: 20 }}>
                  {[
                    ['products', 'Product Details'],
                    ['terms', 'Commercial Terms and Conditions'],
                    ['followup', 'Follow Up'],
                    ['files', 'Files'],
                  ].map(([key, label]) => (
                    <button key={key} onClick={() => setActiveTab(key)} style={{
                      padding: '10px 16px', background: 'none', border: 'none',
                      cursor: 'pointer', fontFamily: FONT, fontSize: '13px',
                      fontWeight: activeTab === key ? 700 : 400,
                      color: activeTab === key ? PRIMARY : '#6b7280',
                      borderBottom: `2px solid ${activeTab === key ? PRIMARY : 'transparent'}`,
                      marginBottom: -1, whiteSpace: 'nowrap',
                    }}>
                      {label}
                    </button>
                  ))}
                </div>

                {/* ── Product Details tab ── */}
                {activeTab === 'products' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 150 }}>
                        <FL label="Currency">
                          <select style={selectStyle} value={currency} onChange={e => setCurrency(e.target.value)}>
                            <option value="INR">INR (₹)</option>
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                            <option value="GBP">GBP (£)</option>
                          </select>
                        </FL>
                      </div>
                      <div style={{ width: 200 }}>
                        <FL label="Value" gray>
                          <input style={readonlyStyle} readOnly value={grandTotal ? `${currency} ${formatINR(grandTotal)}` : `${currency} 0`} />
                        </FL>
                      </div>
                      <div style={{ marginLeft: 'auto' }}>
                        <button onClick={() => setShowProductModal(true)} style={primaryBtn}>
                          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                          Manage Products
                        </button>
                      </div>
                    </div>

                    {lineItems.length === 0 ? (
                      <div style={{ border: '2px dashed #e5e7eb', borderRadius: 8, padding: '36px', textAlign: 'center', color: '#9ca3af', fontSize: '13px', fontFamily: FONT }}>
                        No products added yet. Click "Manage Products" to get started.
                      </div>
                    ) : (
                      <>
                        <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
                            <thead>
                              <tr style={{ background: PRIMARY }}>
                                {['Job Code', 'Cust. Part No', 'Part No.', 'Description', 'HSN Code', 'Quantity', 'Unit', 'Unit Price', 'Total', 'Tax Group Code', ''].map(h => (
                                  <th key={h} style={{ padding: '10px 10px', fontSize: '11px', fontWeight: 600, color: '#fff', textAlign: 'left', whiteSpace: 'nowrap', fontFamily: FONT }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {lineItems.map((item, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 === 0 ? '#fafafa' : '#fff' }}>
                                  <td style={tdS}>{item.job_code || '—'}</td>
                                  <td style={tdS}>{item.customer_part_no || '—'}</td>
                                  <td style={tdS}>{item.part_no || '—'}</td>
                                  <td style={{ ...tdS, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.product_name_snapshot}</td>
                                  <td style={tdS}>{item.hsn_snapshot || '—'}</td>
                                  <td style={tdS}>{item.quantity}</td>
                                  <td style={tdS}>{item.unit_snapshot}</td>
                                  <td style={tdS}>{currency === 'INR' ? '₹' : currency}{formatINR(item.unit_price)}</td>
                                  <td style={tdS}>{currency === 'INR' ? '₹' : currency}{formatINR(item.line_total)}</td>
                                  <td style={tdS}>{item.tax_group_code}</td>
                                  <td style={{ padding: '8px 10px' }}>
                                    <button 
                                      onClick={() => handleDeleteItem(i)} 
                                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex' }}
                                      title="Delete item"
                                    >
                                      <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <polyline points="3 6 5 6 21 6" />
                                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                        <path d="M10 11v6M14 11v6" />
                                      </svg>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div style={{ textAlign: 'center', padding: '11px 16px', background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: PRIMARY, fontFamily: FONT }}>
                            Total Order Value — {currency} {formatINR(totalOrderValue)} : {numToWords(totalOrderValue)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* ── Commercial Terms tab ── */}
                {activeTab === 'terms' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                      <FL label="Payment Terms"><input style={inputStyle} value={terms.payment_terms} onChange={e => setTerms(p => ({ ...p, payment_terms: e.target.value }))} /></FL>
                      <FL label="Sales Tax"><input style={inputStyle} value={terms.sales_tax} onChange={e => setTerms(p => ({ ...p, sales_tax: e.target.value }))} /></FL>
                      <FL label="Sup Charges"><input style={inputStyle} value={terms.sup_charges} onChange={e => setTerms(p => ({ ...p, sup_charges: e.target.value }))} /></FL>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                      <FL label="Excise Duty"><input style={inputStyle} value={terms.excise_duty} onChange={e => setTerms(p => ({ ...p, excise_duty: e.target.value }))} /></FL>
                      <FL label="Price Basis"><input style={inputStyle} value={terms.price_basis} onChange={e => setTerms(p => ({ ...p, price_basis: e.target.value }))} /></FL>
                      <FL label="Freight"><input style={inputStyle} value={terms.freight} onChange={e => setTerms(p => ({ ...p, freight: e.target.value }))} /></FL>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                      <FL label="Warranty"><input style={inputStyle} value={terms.warranty} onChange={e => setTerms(p => ({ ...p, warranty: e.target.value }))} /></FL>
                      <FL label="Insurance"><input style={inputStyle} value={terms.insurance} onChange={e => setTerms(p => ({ ...p, insurance: e.target.value }))} /></FL>
                      <FL label="Delivery"><input style={inputStyle} value={terms.delivery} onChange={e => setTerms(p => ({ ...p, delivery: e.target.value }))} /></FL>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                      <FL label="Packaging & Forward"><input style={inputStyle} value={terms.packing_forwarding} onChange={e => setTerms(p => ({ ...p, packing_forwarding: e.target.value }))} /></FL>
                      <FL label="Validity"><input style={inputStyle} value={terms.validity} onChange={e => setTerms(p => ({ ...p, validity: e.target.value }))} /></FL>
                      <FL label="Decision Expected"><input style={inputStyle} value={terms.decision_expected} onChange={e => setTerms(p => ({ ...p, decision_expected: e.target.value }))} /></FL>
                    </div>
                    <FL label="Remark / Comments">
                      <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 64 }} value={terms.remarks} onChange={e => setTerms(p => ({ ...p, remarks: e.target.value }))} />
                    </FL>
                    <FL label="Order to be Placed">
                      <input style={inputStyle} value={terms.order_to_be_placed || ''} onChange={e => setTerms(p => ({ ...p, order_to_be_placed: e.target.value }))} placeholder="e.g. After board approval" />
                    </FL>
                  </div>
                )}

                {/* ── Follow Up tab ── */}
                {activeTab === 'followup' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {followUps.length === 0 && (
                      <div style={{ color: '#9ca3af', fontSize: '13px', textAlign: 'center', padding: '24px', fontFamily: FONT }}>
                        No follow-ups added yet.
                      </div>
                    )}
                    {followUps.map((fu, i) => (
                      <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: PRIMARY, fontFamily: FONT }}>
                            {i + 1}{i === 0 ? 'st' : i === 1 ? 'nd' : i === 2 ? 'rd' : 'th'} Follow Up
                          </span>
                          <button onClick={() => removeFU(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '12px', fontWeight: 500, fontFamily: FONT }}>
                            Remove
                          </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 13 }}>
                            <FL label="Follow Up Date"><input type="date" style={inputStyle} value={fu.follow_up_date} onChange={e => setFU(i, 'follow_up_date', e.target.value)} /></FL>
                            <FL label="Contact Person"><input style={inputStyle} value={fu.contact_person} onChange={e => setFU(i, 'contact_person', e.target.value)} placeholder="Name" /></FL>
                            <FL label="Contact Phone"><input style={inputStyle} value={fu.contact_phone} onChange={e => setFU(i, 'contact_phone', e.target.value)} /></FL>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 13 }}>
                            <FL label="Contact Email"><input style={inputStyle} value={fu.contact_email} onChange={e => setFU(i, 'contact_email', e.target.value)} /></FL>
                            <FL label="Remarks"><input style={inputStyle} value={fu.remarks} onChange={e => setFU(i, 'remarks', e.target.value)} /></FL>
                          </div>
                        </div>
                      </div>
                    ))}
                    <button onClick={addFollowUp} style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '0 auto', background: 'none', border: `1px dashed ${PRIMARY}`, borderRadius: 8, padding: '9px 22px', cursor: 'pointer', color: PRIMARY, fontSize: '13px', fontWeight: 500, fontFamily: FONT }}>
                      <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                      Add Follow-Up
                    </button>
                  </div>
                )}

                {/* ── Files tab ── */}
                {activeTab === 'files' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: PRIMARY, fontFamily: FONT }}>Files ({files.length})</span>
                      <button onClick={() => fileRef.current?.click()} style={outlineBtn}>
                        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.41 17.41a2 2 0 0 1-2.83-2.83l8.49-8.49" strokeLinecap="round" /></svg>
                        Attach Files
                      </button>
                      <input ref={fileRef} type="file" multiple style={{ display: 'none' }} onChange={handleFileAdd} />
                    </div>
          {files.length === 0 ? (
            <div style={{ border: '2px dashed #e5e7eb', borderRadius: 8, padding: '36px', textAlign: 'center', color: '#9ca3af', fontSize: '13px', fontFamily: FONT }}>
              No files attached yet.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
              {files.map((f, i) => {
                const ext = f.name.split('.').pop()?.toUpperCase() || 'FILE'
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 13px', background: i === 0 ? '#EEF3FF' : '#fafafa' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke={PRIMARY} strokeWidth={2}>
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: i === 0 ? PRIMARY : '#374151', fontFamily: FONT }}>
                          {f.name.length > 22 ? f.name.slice(0, 22) + '…' : f.name}
                        </div>
                        <div style={{ fontSize: '11px', color: '#9ca3af', fontFamily: FONT }}>
                          {(f.size / (1024 * 1024)).toFixed(1)} MB — {ext}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => removeFile(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex' }}>
                      <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                      </svg>
                    </button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 28px', borderTop: '1px solid #f0f0f0', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff' }}>
          <div>
            {step === 2 && grandTotal > 0 && (
              <>
                <div style={{ fontSize: '11.5px', color: '#6b7280', fontFamily: FONT }}>Quotation Amount :</div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: PRIMARY, fontFamily: FONT }}>
                  {currency} {formatINR(grandTotal)}/-
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280', fontFamily: FONT }}>{numToWords(grandTotal)}</div>
              </>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={step === 1 ? onClose : () => setStep(1)} style={outlineBtn}>
              {step === 1 ? 'Cancel' : 'Back'}
            </button>
            {step === 1 ? (
              <button onClick={() => setStep(2)} style={primaryBtn}>Next</button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting}
                style={{ ...primaryBtn, background: submitting ? '#94a3b8' : PRIMARY, cursor: submitting ? 'not-allowed' : 'pointer' }}>
                {submitting ? 'Creating...' : 'Create Quotation'}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function defaultTerms() {
  return {
    payment_terms: '100% against delivery (COD Basis)',
    sales_tax: 'GST 18%',
    sup_charges: 'Not Applicable',
    excise_duty: 'Not Applicable',
    price_basis: 'Ex. Works',
    freight: 'Extra to our accounts',
    warranty: '12 Months from the date of supply against manufacturing defects',
    insurance: 'Extra to your accounts',
    delivery: '4/6 weeks from dt of receipt of techno commercial',
    packing_forwarding: 'Extra',
    validity: 'Valid upto 30 days from the date of this offer',
    decision_expected: 'Yet to Know',
    remarks: 'Extra',
    order_to_be_placed: '',
  }
}

const sectionTitle = { fontSize: '14px', fontWeight: 700, color: PRIMARY, fontFamily: FONT, marginBottom: 14 }

const outlineBtn = {
  display: 'flex', alignItems: 'center', gap: 6,
  padding: '9px 20px', border: '1px solid #d1d5db',
  borderRadius: 7, background: '#fff',
  fontSize: '13px', fontWeight: 500, cursor: 'pointer',
  color: '#374151', fontFamily: FONT,
}

const primaryBtn = {
  display: 'flex', alignItems: 'center', gap: 6,
  padding: '9px 20px', border: 'none',
  borderRadius: 7, background: PRIMARY,
  fontSize: '13px', fontWeight: 600, cursor: 'pointer',
  color: '#fff', fontFamily: FONT,
}

const tdS = { padding: '9px 10px', fontSize: '12px', fontFamily: FONT, color: '#374151', whiteSpace: 'nowrap' }