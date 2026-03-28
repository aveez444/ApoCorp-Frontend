import { useState, useEffect, useRef } from 'react'
import api from '../../api/axios'

// ─── Design tokens ─────────────────────────────────────────────────────────────
const FONT = 'Lato, sans-serif'
const PRIMARY = '#122C41'
const BORDER = '#d1d5db'
const LABEL_COLOR = '#6b7280'
const TEXT = '#1a1a2e'

// ─── Reusable styled inputs ────────────────────────────────────────────────────
const baseInput = {
  border: `1px solid ${BORDER}`,
  borderRadius: 7,
  padding: '12px 14px',
  fontSize: '14px',
  fontFamily: FONT,
  color: TEXT,
  outline: 'none',
  background: '#fff',
  width: '100%',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
}

const selectBase = {
  ...baseInput,
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 13px center',
  paddingRight: 38,
  cursor: 'pointer',
}

const readonlyInput = {
  ...baseInput,
  background: '#f9fafb',
  color: '#6b7280',
  cursor: 'default',
}

// ─── Floating Label Field ──────────────────────────────────────────────────────
function Field({ label, children, style }) {
  return (
    <div style={{ position: 'relative', ...style }}>
      <span style={{
        position: 'absolute', top: -9, left: 10,
        background: '#fff', padding: '0 4px',
        fontSize: '11px', fontWeight: 600,
        color: LABEL_COLOR, fontFamily: FONT,
        zIndex: 1, pointerEvents: 'none', letterSpacing: '0.2px',
      }}>
        {label}
      </span>
      {children}
    </div>
  )
}

// In NewEnquiryModal.jsx - Update SearchableCustomerSelect component

function SearchableCustomerSelect({ value, onChange, placeholder }) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [initialLoaded, setInitialLoaded] = useState(false) // Track if initial load done
  
  const wrapperRef = useRef(null)
  const inputRef = useRef(null)
  const listRef = useRef(null)
  const searchTimeoutRef = useRef(null)

  // Load initial customers when dropdown opens
  const loadInitialCustomers = async () => {
    if (initialLoaded) return
    
    setLoading(true)
    try {
      const res = await api.get('/customers/search/', {
        params: { q: '', page: 1, limit: 20 }
      })
      
      const newCustomers = res.data.results
      setHasMore(res.data.has_next)
      setTotal(res.data.total)
      setCustomers(newCustomers)
      setPage(1)
      setInitialLoaded(true)
    } catch (error) {
      console.error('Failed to load initial customers:', error)
    } finally {
      setLoading(false)
    }
  }

  // Search customers with debounce
  const searchCustomers = async (query, pg = 1, append = false) => {
    setLoading(true)
    try {
      const res = await api.get('/customers/search/', {
        params: { q: query, page: pg, limit: 20 }
      })
      
      const newCustomers = res.data.results
      setHasMore(res.data.has_next)
      setTotal(res.data.total)
      
      if (append) {
        setCustomers(prev => [...prev, ...newCustomers])
      } else {
        setCustomers(newCustomers)
      }
      setPage(pg)
    } catch (error) {
      console.error('Customer search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  // Debounced search (only when there's a search term)
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    if (!isOpen) return
    
    // If there's a search term, search; otherwise show initial customers
    if (searchTerm) {
      searchTimeoutRef.current = setTimeout(() => {
        searchCustomers(searchTerm, 1, false)
      }, 300)
    } else {
      // Load initial customers when dropdown opens and no search term
      loadInitialCustomers()
    }
    
    return () => clearTimeout(searchTimeoutRef.current)
  }, [searchTerm, isOpen])

  // Load more on scroll
  const loadMore = () => {
    if (!loading && hasMore && isOpen) {
      if (searchTerm) {
        searchCustomers(searchTerm, page + 1, true)
      } else {
        // Load more initial customers
        setLoading(true)
        api.get('/customers/search/', {
          params: { q: '', page: page + 1, limit: 20 }
        }).then(res => {
          const newCustomers = res.data.results
          setHasMore(res.data.has_next)
          setTotal(res.data.total)
          setCustomers(prev => [...prev, ...newCustomers])
          setPage(prev => prev + 1)
        }).catch(console.error)
        .finally(() => setLoading(false))
      }
    }
  }

  // Scroll handler for infinite scroll
  const handleScroll = (e) => {
    const bottom = e.target.scrollHeight - e.target.scrollTop <= e.target.clientHeight + 50
    if (bottom) {
      loadMore()
    }
  }

  // Reset when dropdown closes
  const handleClose = () => {
    setIsOpen(false)
    setSearchTerm('')
    setHighlightedIndex(-1)
    // Don't reset customers immediately to avoid flicker, but clear initialLoaded flag
    // so next open loads fresh
    setInitialLoaded(false)
  }

  // Get selected customer
  const selectedCustomer = customers.find(c => String(c.id) === value)

  const handleSelect = (customerId, customerData) => {
    onChange(customerId, customerData)
    handleClose()
    setCustomers([]) // Clear results
  }

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev < customers.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && customers[highlightedIndex]) {
          handleSelect(String(customers[highlightedIndex].id), customers[highlightedIndex])
        } else if (customers.length === 1) {
          handleSelect(String(customers[0].id), customers[0])
        }
        break
      case 'Escape':
        handleClose()
        break
    }
  }

  // Style definitions (same as before)
  const selectBase = {
    border: `1px solid ${BORDER}`,
    borderRadius: 7,
    padding: '12px 14px',
    fontSize: '14px',
    fontFamily: FONT,
    color: TEXT,
    outline: 'none',
    background: '#fff',
    width: '100%',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  }

  const arrowStyle = {
    position: 'absolute',
    right: 13,
    top: '50%',
    transform: 'translateY(-50%)',
    cursor: 'pointer',
    pointerEvents: 'auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }

  const dropdownStyle = {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    left: 0,
    right: 0,
    background: '#fff',
    border: `1px solid ${BORDER}`,
    borderRadius: 7,
    maxHeight: 280,
    overflowY: 'auto',
    zIndex: 10,
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  }

  const listStyle = {
    margin: 0,
    padding: 0,
    listStyle: 'none',
  }

  const listItemStyle = {
    padding: '10px 14px',
    cursor: 'pointer',
    fontSize: '14px',
    fontFamily: FONT,
    color: TEXT,
    borderBottom: `1px solid ${BORDER}`,
    transition: 'background 0.15s',
  }

  const loadingStyle = {
    padding: '20px 14px',
    textAlign: 'center',
    fontSize: '13px',
    color: '#9ca3af',
    fontFamily: FONT,
  }

  const loadingMoreStyle = {
    padding: '12px',
    textAlign: 'center',
    fontSize: '12px',
    color: '#9ca3af',
    fontFamily: FONT,
    borderTop: `1px solid ${BORDER}`,
  }

  const emptyStyle = {
    padding: '20px 14px',
    textAlign: 'center',
    fontSize: '13px',
    color: '#9ca3af',
    fontFamily: FONT,
  }

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <input
        ref={inputRef}
        type="text"
        style={selectBase}
        placeholder={placeholder || 'Type to search or select customer...'}
        value={isOpen ? searchTerm : (selectedCustomer?.company_name || '')}
        onChange={(e) => {
          setSearchTerm(e.target.value)
          setIsOpen(true)
          setHighlightedIndex(-1)
          if (!e.target.value && !selectedCustomer) {
            onChange('', null)
          }
        }}
        onFocus={() => {
          setIsOpen(true)
          setSearchTerm('')
        }}
        onKeyDown={handleKeyDown}
      />
      
      {/* Dropdown arrow icon */}
      <div
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) {
            setSearchTerm('')
            inputRef.current?.focus()
          }
        }}
        style={arrowStyle}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {/* Dropdown list */}
      {isOpen && (
        <div
          ref={listRef}
          onScroll={handleScroll}
          style={dropdownStyle}
        >
          {loading && customers.length === 0 ? (
            <div style={loadingStyle}>Loading customers...</div>
          ) : customers.length > 0 ? (
            <>
              <div style={{ padding: '8px 12px', background: '#f9fafb', borderBottom: `1px solid ${BORDER}` }}>
                <span style={{ fontSize: '11px', color: '#6b7280' }}>
                  {total} customer{total !== 1 ? 's' : ''} found
                </span>
              </div>
              <ul style={listStyle}>
                {customers.map((customer, idx) => (
                  <li
                    key={customer.id}
                    onClick={() => handleSelect(String(customer.id), customer)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    style={{
                      ...listItemStyle,
                      background: highlightedIndex === idx ? '#f3f4f6' : '#fff',
                      borderBottom: idx < customers.length - 1 ? `1px solid ${BORDER}` : 'none',
                    }}
                  >
                    <div style={{ fontWeight: 500 }}>{customer.company_name}</div>
                    {customer.customer_code && (
                      <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: 2 }}>
                        Code: {customer.customer_code}
                      </div>
                    )}
                    {customer.email && (
                      <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: 2 }}>
                        {customer.email}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              {loading && customers.length > 0 && (
                <div style={loadingMoreStyle}>Loading more...</div>
              )}
            </>
          ) : searchTerm ? (
            <div style={emptyStyle}>No customers found</div>
          ) : (
            <div style={emptyStyle}>Type to search customers</div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Step Indicator ────────────────────────────────────────────────────────────
// ─── Step Indicator (Clickable) ────────────────────────────────────────────────
function StepIndicator({ step, onStepChange }) {
  const steps = [
    { n: 1, label1: 'Customer', label2: 'Details' },
    { n: 2, label1: 'Enquiry', label2: 'Details' },
  ]
  
  const handleStepClick = (stepNumber) => {
    // Validate if we can go to that step
    if (stepNumber === 2 && step === 1) {
      // When trying to go to step 2 from step 1, validate customer selection
      if (onStepChange) {
        onStepChange(stepNumber, true) // Pass true to indicate we need validation
      }
    } else if (stepNumber === 1 && step === 2) {
      // Going back to step 1 is always allowed
      if (onStepChange) {
        onStepChange(stepNumber, false)
      }
    } else if (stepNumber === step) {
      // Clicking on current step - do nothing
      return
    } else if (stepNumber < step) {
      // Going to previous steps is always allowed
      if (onStepChange) {
        onStepChange(stepNumber, false)
      }
    }
  }
  
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: 0, marginBottom: 32 }}>
      {steps.map((s, idx) => {
        const done = step > s.n
        const active = step === s.n
        const isClickable = (s.n < step) || (s.n === 2 && step === 1) // Step 2 is clickable from step 1
        
        return (
          <div key={s.n} style={{ display: 'flex', alignItems: 'flex-start' }}>
            <div 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: 8,
                cursor: isClickable ? 'pointer' : 'default',
                opacity: isClickable ? 1 : 0.8,
              }}
              onClick={() => isClickable && handleStepClick(s.n)}
            >
              <div style={{
                width: 42, height: 42, borderRadius: '50%',
                background: active || done ? PRIMARY : '#fff',
                border: `2px solid ${active || done ? PRIMARY : '#d1d5db'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: active || done ? '#fff' : '#9ca3af',
                fontWeight: 700, fontSize: '16px', fontFamily: FONT,
                flexShrink: 0,
                transition: 'all 0.2s ease',
                ...(isClickable && {
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: '0 2px 8px rgba(18,44,65,0.2)',
                  }
                })
              }}>
                {done ? (
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : s.n}
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: active ? PRIMARY : '#9ca3af', fontFamily: FONT, lineHeight: 1.3 }}>
                  {s.label1}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: active ? PRIMARY : '#9ca3af', fontFamily: FONT, lineHeight: 1.3 }}>
                  {s.label2}
                </div>
              </div>
            </div>
            {idx < steps.length - 1 && (
              <div style={{ 
                width: 110, height: 2, 
                background: step > 1 ? PRIMARY : '#d1d5db', 
                margin: '20px 10px 0', 
                flexShrink: 0,
                transition: 'background 0.3s ease',
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Section Title ─────────────────────────────────────────────────────────────
function SectionTitle({ children }) {
  return (
    <div style={{
      fontSize: '15px', fontWeight: 700, color: PRIMARY,
      fontFamily: FONT, marginBottom: 18, paddingBottom: 10,
      borderBottom: `1.5px solid #eef0f4`,
    }}>
      {children}
    </div>
  )
}

// ─── File Card ─────────────────────────────────────────────────────────────────
function FileCard({ file, onRemove, active }) {
  const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE'
  const kb = (file.size / 1024).toFixed(0)
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      border: `1.5px solid ${active ? '#3b82f6' : BORDER}`,
      borderRadius: 8, padding: '10px 14px',
      background: active ? '#EEF5FF' : '#fafafa',
      transition: 'all 0.15s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 6,
          background: '#EEF3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={PRIMARY} strokeWidth={2}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        </div>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: active ? '#3b82f6' : TEXT, fontFamily: FONT }}>{file.name}</div>
          <div style={{ fontSize: '11px', color: '#9ca3af', fontFamily: FONT }}>{kb} KB ~ {ext} File</div>
        </div>
      </div>
      {onRemove && (
        <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4, display: 'flex' }}>
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  )
}

// ─── Main Modal ────────────────────────────────────────────────────────────────
export default function NewEnquiryModal({ open, onClose, onSuccess }) {
  const [step, setStep] = useState(1)
  const [users, setUsers] = useState([])
  const [files, setFiles] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [activeFileIdx, setActiveFileIdx] = useState(null)
  const fileRef = useRef()
  const today = new Date().toISOString().slice(0, 10)

  // ── Step 1 state ──
  const [s1, setS1] = useState({
    customer: '',
    enquiry_date: today,
    // display-only snapshot (auto-filled from customer selection)
    _poc: '',
    _email: '',
    _phone_mobile: '',
    _phone_landline: '',
    _country: '',
    _state: '',
    _city: '',
    _address: '',
  })

  // ── Step 2 state ──
  const [s2, setS2] = useState({
    subject: '',
    product_name: '',
    currency: 'INR',
    prospective_value: '',
    enquiry_type: '',
    source_of_enquiry: '',
    due_date: '',
    target_submission_date: '',
    priority: 'MEDIUM',
    region: '',
    regional_manager: '',
    // Tender specific fields
    emd_amount: '',
    dd_pbg: '',
    emd_due_date: '',
    tender_number: '',
    transaction_id: '',
    emd_return_amount: '',
    emd_return_date: '',
  })

  // Update the useEffect in NewEnquiryModal component
  useEffect(() => {
    if (!open) return
    
    const fetchData = async () => {
      try {
        // Remove the customers fetch - we don't need it since SearchableCustomerSelect handles it
        const usersRes = await api.get('/accounts/users/?role=all')
        setUsers(usersRes.data || [])
      } catch (error) {
        console.error('Error fetching modal data:', error)
      }
    }
    
    fetchData()

    // Reset all
    setStep(1)
    setFiles([])
    setActiveFileIdx(null)
    setS1({ 
      customer: '', 
      enquiry_date: today, 
      _poc: '', 
      _email: '', 
      _phone_mobile: '', 
      _phone_landline: '', 
      _country: '', 
      _state: '', 
      _city: '', 
      _address: '' 
    })
    setS2({ 
      subject: '', 
      product_name: '', 
      currency: 'INR', 
      prospective_value: '', 
      enquiry_type: '', 
      source_of_enquiry: '', 
      due_date: '', 
      target_submission_date: '', 
      priority: 'MEDIUM', 
      region: '', 
      regional_manager: '',
      emd_amount: '',
      dd_pbg: '',
      emd_due_date: '',
      tender_number: '',
      transaction_id: '',
      emd_return_amount: '',
      emd_return_date: '',
    })
  }, [open, today])
// In NewEnquiryModal.jsx - Update the handleCustomerSelect function

  const handleCustomerSelect = async (customerId, customerData) => {
    if (customerData && customerData.company_name) {
      // If we have partial data (from dropdown), fetch full details
      try {
        const fullCustomerRes = await api.get(`/customers/${customerId}/`)
        const fullCustomerData = fullCustomerRes.data
        
        const primaryPoc = fullCustomerData.pocs?.find(p => p.is_primary) || fullCustomerData.pocs?.[0]
        // Get default billing address if exists
        const defaultAddress = fullCustomerData.addresses?.find(a => a.is_default) || fullCustomerData.addresses?.[0]
        
        setS1(prev => ({
          ...prev,
          customer: customerId,
          _poc: primaryPoc?.name || '',
          _email: fullCustomerData.email || '',
          _phone_mobile: fullCustomerData.telephone_primary || '',
          _phone_landline: fullCustomerData.telephone_secondary || '',
          _country: fullCustomerData.country || defaultAddress?.country || '',
          _state: fullCustomerData.state || defaultAddress?.state || '',
          _city: fullCustomerData.city || defaultAddress?.city || '',
          _address: defaultAddress?.address_line || '',
        }))
      } catch (error) {
        console.error('Failed to fetch customer details:', error)
        // Fallback to the data we have
        const primaryPoc = customerData.pocs?.find(p => p.is_primary) || customerData.pocs?.[0]
        setS1(prev => ({
          ...prev,
          customer: customerId,
          _poc: primaryPoc?.name || '',
          _email: customerData.email || '',
          _phone_mobile: customerData.telephone_primary || '',
          _phone_landline: customerData.telephone_secondary || '',
          _country: customerData.country || '',
          _state: customerData.state || '',
          _city: customerData.city || '',
          _address: customerData.address || '',
        }))
      }
    } else {
      setS1(prev => ({ ...prev, customer: customerId }))
    }
  }

  const handleFileAdd = (e) => {
    const newFiles = Array.from(e.target.files)
    setFiles(prev => [...prev, ...newFiles])
    e.target.value = ''
  }

  // Inside NewEnquiryModal component, add this function:

  const handleStepChange = (newStep, validateCustomer = false) => {
    // If moving to step 2 and validation is required
    if (validateCustomer && newStep === 2) {
      if (!s1.customer) {
        alert('Please select a customer first before proceeding to Enquiry Details.')
        return
      }
      setStep(2)
    } else {
      // For any other step navigation, just change the step
      setStep(newStep)
    }
  }

  const handleSubmit = async () => {
    if (!s1.customer) { 
      alert('Please select a customer.'); 
      return 
    }
    
    // Validate tender fields if required
    if (s2.enquiry_type === 'TENDER') {
      if (!s2.emd_amount) { alert('EMD Amount is required for Tender enquiries'); return }
      if (!s2.dd_pbg) { alert('DD/PBG is required for Tender enquiries'); return }
      if (!s2.emd_due_date) { alert('EMD Due Date is required for Tender enquiries'); return }
      if (!s2.tender_number) { alert('Tender Number is required for Tender enquiries'); return }
    }
    
    setSubmitting(true)
    try {
      // Create enquiry payload
      const payload = {
        customer: s1.customer,
        enquiry_date: s1.enquiry_date || today,
        subject: s2.subject,
        product_name: s2.product_name,
        currency: s2.currency,
        prospective_value: s2.prospective_value ? parseFloat(s2.prospective_value) : null,
        enquiry_type: s2.enquiry_type,
        source_of_enquiry: s2.source_of_enquiry,
        due_date: s2.due_date || null,
        target_submission_date: s2.target_submission_date || null,
        priority: s2.priority,
        region: s2.region || '',
        regional_manager: s2.regional_manager || null,
      }
      
      // Add tender fields if enquiry type is TENDER
      if (s2.enquiry_type === 'TENDER') {
        payload.emd_amount = s2.emd_amount ? parseFloat(s2.emd_amount) : null
        payload.dd_pbg = s2.dd_pbg
        payload.emd_due_date = s2.emd_due_date || null
        payload.tender_number = s2.tender_number
        payload.transaction_id = s2.transaction_id || null
        payload.emd_return_amount = s2.emd_return_amount ? parseFloat(s2.emd_return_amount) : null
        payload.emd_return_date = s2.emd_return_date || null
      }

      console.log('Creating enquiry with payload:', payload)
      
      // Create the enquiry
      const res = await api.post('/enquiries/', payload)
      console.log('Enquiry created successfully:', res.data)
      
      const enquiryId = res.data.id

      // Upload files if any
      if (files.length > 0) {
        console.log(`Uploading ${files.length} files for enquiry ${enquiryId}`)
        
        for (const file of files) {
          const fd = new FormData()
          fd.append('file', file)
          
          try {
            const uploadUrl = `/enquiries/${enquiryId}/upload_file/`
            console.log(`Uploading ${file.name} to ${uploadUrl}`)
            
            await api.post(uploadUrl, fd, {
              headers: { 'Content-Type': 'multipart/form-data' },
            })
            console.log(`File ${file.name} uploaded successfully`)
          } catch (uploadError) {
            console.error(`Failed to upload ${file.name}:`, uploadError)
            console.error('Error response:', uploadError.response?.data)
          }
        }
      }

      // Success message
      const enqNum = res.data.enquiry_number
      const custName = res.data.customer_snapshot?.company_name || ''
      onSuccess?.(`${enqNum}${custName ? ` (${custName})` : ''} created successfully!`)
      onClose()
    } catch (err) {
      console.error('Submission error:', err)
      console.error('Error response:', err.response?.data)
      
      const errorMsg = err.response?.data 
        ? typeof err.response.data === 'object' 
          ? JSON.stringify(err.response.data) 
          : err.response.data
        : 'Something went wrong. Please try again.'
      alert(errorMsg)
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(10,20,35,0.45)', zIndex: 1000 }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        background: '#fff', borderRadius: 14,
        width: '92%', maxWidth: 900,
        maxHeight: '92vh',
        display: 'flex', flexDirection: 'column',
        zIndex: 1001,
        boxShadow: '0 24px 80px rgba(0,0,0,0.22)',
        fontFamily: FONT,
      }}>

        {/* ── Header ── */}
        <div style={{
          padding: '22px 30px 18px',
          borderBottom: '1px solid #eef0f4',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <span style={{ fontWeight: 700, fontSize: '20px', color: PRIMARY, fontFamily: FONT }}>
            New Enquiry
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 4, display: 'flex' }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* ── Body ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 30px' }}>
         {/* Replace the existing StepIndicator line with this */}
        <StepIndicator step={step} onStepChange={handleStepChange} />

          {/* ════ STEP 1 ════ */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

              {/* Enquiry No. & Date */}
              <div>
                <SectionTitle>Enquiry No. &amp; Date</SectionTitle>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 230px', gap: 18 }}>
                  <Field label="Enquiry Number">
                    <input style={readonlyInput} value="Auto-generated" readOnly />
                  </Field>
                  <Field label="Enquiry Date">
                    <input
                      type="date"
                      style={baseInput}
                      value={s1.enquiry_date}
                      onChange={e => setS1(p => ({ ...p, enquiry_date: e.target.value }))}
                    />
                  </Field>
                </div>
              </div>

              {/* Customer Details */}
              <div>
                <SectionTitle>Customer Details</SectionTitle>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                  {/* Entity + POC */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                  
                      <Field label="Entity Name *">
                        <SearchableCustomerSelect
                          value={s1.customer}
                          onChange={handleCustomerSelect}
                          placeholder="Type to search or select customer..."
                        />
                      </Field>
                    <Field label="POC (Primary Contact)">
                      <input
                        style={readonlyInput}
                        placeholder="Auto-filled"
                        value={s1._poc}
                        readOnly
                      />
                    </Field>
                  </div>

                  {/* Email + Landline + Mobile */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18 }}>
                    <Field label="Email ID">
                      <input style={readonlyInput} value={s1._email} readOnly placeholder="—" />
                    </Field>
                    <Field label="Phone (Landline)">
                      <input style={readonlyInput} value={s1._phone_landline} readOnly placeholder="—" />
                    </Field>
                    <Field label="Phone (Mobile)">
                      <input style={readonlyInput} value={s1._phone_mobile} readOnly placeholder="—" />
                    </Field>
                  </div>

                  {/* Country + State + City */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18 }}>
                    <Field label="Country">
                      <input style={readonlyInput} value={s1._country} readOnly placeholder="—" />
                    </Field>
                    <Field label="State">
                      <input style={readonlyInput} value={s1._state} readOnly placeholder="—" />
                    </Field>
                    <Field label="City">
                      <input style={readonlyInput} value={s1._city} readOnly placeholder="—" />
                    </Field>
                  </div>

                  {/* Detailed Address */}
                  <Field label="Detailed Address">
                    <textarea
                      style={{ ...readonlyInput, resize: 'none', minHeight: 70 }}
                      value={s1._address}
                      readOnly
                      placeholder="Auto-filled from customer record"
                    />
                  </Field>
                </div>
              </div>
            </div>
          )}

          {/* ════ STEP 2 ════ */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

              {/* Enquiry No. & Date — readonly recap */}
              <div>
                <SectionTitle>Enquiry No. &amp; Date</SectionTitle>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 230px', gap: 18 }}>
                  <Field label="Enquiry Number">
                    <input style={readonlyInput} value="Auto-generated" readOnly />
                  </Field>
                  <Field label="Enquiry Date">
                    <input style={readonlyInput} value={s1.enquiry_date} readOnly />
                  </Field>
                </div>
              </div>

              {/* Enquiry Details */}
              <div>
                <SectionTitle>Enquiry Details</SectionTitle>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                  {/* Email Subject */}
                  <Field label="Email Subject">
                    <textarea
                      style={{ ...baseInput, resize: 'vertical', minHeight: 78 }}
                      placeholder="Enter the email subject / description"
                      value={s2.subject}
                      onChange={e => setS2(p => ({ ...p, subject: e.target.value }))}
                    />
                  </Field>

                  {/* Product + Currency + Value */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 1fr', gap: 18 }}>
                    <Field label="Product / Item">
                      <input
                        style={baseInput}
                        placeholder="Enter product or item"
                        value={s2.product_name}
                        onChange={e => setS2(p => ({ ...p, product_name: e.target.value }))}
                      />
                    </Field>
                    <Field label="Currency">
                      <select style={selectBase} value={s2.currency} onChange={e => setS2(p => ({ ...p, currency: e.target.value }))}>
                        <option value="INR">INR (₹)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                      </select>
                    </Field>
                    <Field label="Quotation Amount">
                      <input
                        style={baseInput}
                        type="number"
                        placeholder="Enter prospective value"
                        value={s2.prospective_value}
                        onChange={e => setS2(p => ({ ...p, prospective_value: e.target.value }))}
                      />
                    </Field>
                  </div>


                  {/* Enquiry Type + Source + Priority */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18 }}>
                    <Field label="Enquiry Type">
                      <select 
                        style={selectBase} 
                        value={s2.enquiry_type} 
                        onChange={e => setS2(p => ({ ...p, enquiry_type: e.target.value }))}
                      >
                        <option value="">— Select —</option>
                        <option value="BUDGETARY">Budgetary</option>
                        <option value="FIRM">Firm</option>
                        <option value="BID">Bid</option>
                        <option value="PURCHASE">Purchase</option>
                        <option value="NEGOTIATION">Negotiation</option>
                        <option value="TENDER">Tender</option>
                      </select>
                    </Field>
                    <Field label="Source of Enquiry">
                      <input
                        style={baseInput}
                        placeholder="e.g. Sales Engineer"
                        value={s2.source_of_enquiry}
                        onChange={e => setS2(p => ({ ...p, source_of_enquiry: e.target.value }))}
                      />
                    </Field>
                    <Field label="Priority">
                      <select style={selectBase} value={s2.priority} onChange={e => setS2(p => ({ ...p, priority: e.target.value }))}>
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                      </select>
                    </Field>
                  </div>

                  {/* Tender Section - Only show when enquiry_type is TENDER */}
                  {s2.enquiry_type === 'TENDER' && (
                    <div style={{ 
                      marginTop: 20, 
                      padding: '20px', 
                      border: `1px solid ${BORDER}`, 
                      borderRadius: 10,
                      background: '#fef9e3',
                      borderColor: '#fbbf24'
                    }}>
                      <div style={{ 
                        fontSize: '14px', 
                        fontWeight: 700, 
                        color: '#b45309', 
                        marginBottom: 16,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                      }}>
                        
                        Tender Details
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
                        <Field label="EMD Amount *">
                          <input
                            type="number"
                            style={baseInput}
                            placeholder="Enter EMD amount"
                            value={s2.emd_amount}
                            onChange={e => setS2(p => ({ ...p, emd_amount: e.target.value }))}
                          />
                        </Field>
                        <Field label="DD/PBG *">
                          <select 
                            style={selectBase} 
                            value={s2.dd_pbg} 
                            onChange={e => setS2(p => ({ ...p, dd_pbg: e.target.value }))}
                          >
                            <option value="">— Select —</option>
                            <option value="DD">Demand Draft (DD)</option>
                            <option value="PBG">Performance Bank Guarantee (PBG)</option>
                          </select>
                        </Field>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
                        <Field label="EMD Due Date *">
                          <input
                            type="date"
                            style={baseInput}
                            value={s2.emd_due_date}
                            onChange={e => setS2(p => ({ ...p, emd_due_date: e.target.value }))}
                          />
                        </Field>
                        <Field label="Tender Number *">
                          <input
                            style={baseInput}
                            placeholder="Enter tender number"
                            value={s2.tender_number}
                            onChange={e => setS2(p => ({ ...p, tender_number: e.target.value }))}
                          />
                        </Field>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
                        <Field label="Transaction ID">
                          <input
                            style={baseInput}
                            placeholder="Enter transaction ID"
                            value={s2.transaction_id}
                            onChange={e => setS2(p => ({ ...p, transaction_id: e.target.value }))}
                          />
                        </Field>
                        <Field label="EMD Return Amount">
                          <input
                            type="number"
                            style={baseInput}
                            placeholder="Enter EMD return amount"
                            value={s2.emd_return_amount}
                            onChange={e => setS2(p => ({ ...p, emd_return_amount: e.target.value }))}
                          />
                        </Field>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 18 }}>
                        <Field label="EMD Return Date">
                          <input
                            type="date"
                            style={baseInput}
                            value={s2.emd_return_date}
                            onChange={e => setS2(p => ({ ...p, emd_return_date: e.target.value }))}
                          />
                        </Field>
                      </div>
                    </div>
                  )}

                  {/* Due Date + Target Submission */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                    <Field label="Due Date">
                      <input type="date" style={baseInput} value={s2.due_date} onChange={e => setS2(p => ({ ...p, due_date: e.target.value }))} />
                    </Field>
                    <Field label="Target Date Submission">
                      <input type="date" style={baseInput} value={s2.target_submission_date} onChange={e => setS2(p => ({ ...p, target_submission_date: e.target.value }))} />
                    </Field>
                  </div>
                </div>
              </div>

              {/* Region & Regional Manager */}
              <div>
                <SectionTitle>Region &amp; Regional Manager</SectionTitle>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>

                  {/* Region dropdown */}
                  <Field label="Region">
                    <select
                      style={selectBase}
                      value={s2.region}
                      onChange={e => setS2(p => ({ ...p, region: e.target.value }))}
                    >
                      <option value="">— Select Region —</option>
                      <option value="NORTH">North</option>
                      <option value="SOUTH">South</option>
                      <option value="EAST">East</option>
                      <option value="WEST">West</option>
                      <option value="CENTRAL">Central</option>
                    </select>
                  </Field>

                  {/* Regional Manager dropdown */}
            <Field label="Regional Manager">
              <select
                style={selectBase}
                value={s2.regional_manager}
                onChange={e => setS2(p => ({ ...p, regional_manager: e.target.value }))}
              >
                <option value="">— Select Manager —</option>
                {users
                  .filter(u => u.role === 'manager')  // Only show users with role 'manager'
                  .map(u => (
                    <option key={u.id} value={u.id}>
                      {u.first_name || u.last_name
                        ? `${u.first_name} ${u.last_name}`.trim()
                        : u.username}{' '}
                      (Manager)
                    </option>
                  ))}
              </select>
            </Field>
                </div>
              </div>

              {/* Files */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: PRIMARY, fontFamily: FONT }}>
                    Files ({files.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      background: '#fff', border: `1px solid ${BORDER}`,
                      borderRadius: 7, padding: '8px 16px',
                      fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                      color: '#374151', fontFamily: FONT,
                    }}
                  >
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.41 17.41a2 2 0 0 1-2.83-2.83l8.49-8.49" strokeLinecap="round" />
                    </svg>
                    Attach Files
                  </button>
                  <input ref={fileRef} type="file" multiple style={{ display: 'none' }} onChange={handleFileAdd} />
                </div>

                {files.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
                    {files.map((f, i) => (
                      <FileCard
                        key={i}
                        file={f}
                        active={activeFileIdx === i}
                        onRemove={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}
                      />
                    ))}
                  </div>
                )}

                {files.length === 0 && (
                  <div
                    onClick={() => fileRef.current?.click()}
                    style={{
                      border: `1.5px dashed ${BORDER}`, borderRadius: 8,
                      padding: '28px 20px', textAlign: 'center',
                      cursor: 'pointer', color: '#9ca3af', fontSize: '13px',
                      fontFamily: FONT, background: '#fafafa',
                    }}
                  >
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#d1d5db" strokeWidth={1.5} style={{ display: 'block', margin: '0 auto 8px' }}>
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.41 17.41a2 2 0 0 1-2.83-2.83l8.49-8.49" strokeLinecap="round" />
                    </svg>
                    Click to attach files
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: '16px 30px',
          borderTop: '1px solid #eef0f4',
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          gap: 12, flexShrink: 0,
        }}>
          <button
            onClick={step === 1 ? onClose : () => setStep(1)}
            style={{
              padding: '11px 30px', border: `1px solid ${BORDER}`,
              borderRadius: 8, background: '#fff',
              fontSize: '14px', fontWeight: 600, cursor: 'pointer',
              color: '#374151', fontFamily: FONT,
            }}
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>

          {step === 1 ? (
            <button
              onClick={() => {
                if (!s1.customer) { alert('Please select a customer first.'); return }
                setStep(2)
              }}
              style={{
                padding: '11px 30px', border: 'none',
                borderRadius: 8, background: PRIMARY,
                fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                color: '#fff', fontFamily: FONT,
              }}
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                padding: '11px 30px', border: 'none',
                borderRadius: 8, background: submitting ? '#94a3b8' : PRIMARY,
                fontSize: '14px', fontWeight: 700,
                cursor: submitting ? 'not-allowed' : 'pointer',
                color: '#fff', fontFamily: FONT,
              }}
            >
              {submitting ? 'Creating...' : 'Add Enquiry'}
            </button>
          )}
        </div>
      </div>
    </>
  )
}