import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'

const PRIMARY = '#122C41'
const ACCENT  = '#1e88e5'
const FONT    = "'Inter', 'Segoe UI', sans-serif"

const Icon = ({ d, size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
)

const ic = {
  arrowLeft: 'M19 12H5M12 19l-7-7 7-7',
  plus:      'M12 5v14M5 12h14',
  x:         'M18 6L6 18M6 6l12 12',
  check:     'M20 6L9 17l-5-5',
  chevronDown: 'M6 9l6 6 6-6',
}

const TIERS    = [['A','Tier A – Premium'],['B','Tier B – Standard'],['C','Tier C – Basic']]
const CURRENCY = ['INR','USD','EUR','GBP','AED']

const emptyAddr = { 
  entity_name: '', 
  country: 'India', 
  state: '',  
  city: '',   
  address_line: '', 
  contact_person: '', 
  contact_email: '', 
  contact_number: '' 
}

const emptyPOC  = { name:'', email:'', phone:'', designation:'', is_primary:false }

// Floating-label input wrapper
function FloatField({ label, required, error, children }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
      <label style={{ fontSize:11.5, fontWeight:600, color:'#6b7280', letterSpacing:'.05em', textTransform:'uppercase' }}>
        {label}{required && <span style={{ color:'#ef4444' }}> *</span>}
      </label>
      {children}
      {error && <span style={{ fontSize:11.5, color:'#ef4444', marginTop:1 }}>{error}</span>}
    </div>
  )
}

const inputBase = {
  width:'100%', padding:'10px 13px',
  border:'1.5px solid #e5e7eb', borderRadius:8,
  fontSize:13.5, fontFamily:FONT, color:'#111827',
  background:'#fff', transition:'border .15s, box-shadow .15s',
  boxSizing:'border-box',
}

function FInput({ value, onChange, placeholder, type='text', readOnly=false }) {
  return (
    <input 
      type={type} 
      value={value} 
      onChange={onChange} 
      placeholder={placeholder} 
      readOnly={readOnly}
      style={{ ...inputBase, background:readOnly?'#f9fafb':'#fff', cursor:readOnly?'not-allowed':'text' }} 
    />
  )
}

// Custom dropdown component that matches input styling
function CustomSelect({ value, onChange, options, placeholder = "Select an option", disabled = false, loading = false }) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const selectRef = React.useRef(null)

  const selectedOption = options.find(opt => opt.value === value)
  const displayValue = selectedOption ? selectedOption.label : ''

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  )

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (selectedValue) => {
    onChange({ target: { value: selectedValue } })
    setIsOpen(false)
    setSearchTerm('')
  }

  if (loading) {
    return (
      <div style={{ ...inputBase, background: '#f9fafb', cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: '#9ca3af' }}>Loading...</span>
        <div style={{
          width: 16, height: 16,
          border: '2px solid #e5e7eb',
          borderTopColor: ACCENT,
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
      </div>
    )
  }

  if (disabled) {
    return (
      <div style={{ ...inputBase, background: '#f9fafb', cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: '#9ca3af' }}>{displayValue || placeholder}</span>
        <Icon d={ic.chevronDown} size={16} color="#9ca3af" />
      </div>
    )
  }

  return (
    <div ref={selectRef} style={{ position: 'relative', width: '100%' }}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          ...inputBase,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#fff'
        }}
      >
        <span style={{ color: displayValue ? '#111827' : '#9ca3af' }}>
          {displayValue || placeholder}
        </span>
        <div style={{
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s'
        }}>
          <Icon d={ic.chevronDown} size={16} color="#6b7280" />
        </div>
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: 4,
          background: '#fff',
          border: '1.5px solid #e5e7eb',
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          zIndex: 1000,
          maxHeight: 280,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ padding: 8, borderBottom: '1px solid #e5e7eb' }}>
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px',
                border: '1px solid #e5e7eb',
                borderRadius: 6,
                fontSize: 12.5,
                fontFamily: FONT,
                outline: 'none',
                boxSizing: 'border-box'
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          <div style={{ overflowY: 'auto', maxHeight: 220 }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '12px', textAlign: 'center', color: '#9ca3af', fontSize: 12.5 }}>
                No options found
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  style={{
                    padding: '10px 13px',
                    cursor: 'pointer',
                    fontSize: 13.5,
                    fontFamily: FONT,
                    color: '#111827',
                    transition: 'background 0.15s',
                    background: value === option.value ? `${ACCENT}10` : 'transparent',
                    borderBottom: '1px solid #f3f4f6'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.background = value === option.value ? `${ACCENT}10` : 'transparent'}
                >
                  {option.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

function FSelect({ value, onChange, children, disabled = false }) {
  return (
    <select 
      value={value} 
      onChange={onChange} 
      style={{ ...inputBase, background:disabled?'#f9fafb':'#fff', cursor:disabled?'not-allowed':'pointer' }} 
      disabled={disabled}
    >
      {children}
    </select>
  )
}

function Card({ title, icon, children }) {
  return (
    <div style={{ background:'#fff', borderRadius:12, padding:'22px 24px', boxShadow:'0 1px 8px rgba(0,0,0,.06)', marginBottom:16 }}>
      {title && (
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:18, paddingBottom:14, borderBottom:'1px solid #f3f4f6' }}>
          {icon && <span style={{ fontSize:15 }}>{icon}</span>}
          <h3 style={{ fontSize:15, fontWeight:700, color:PRIMARY, margin:0 }}>{title}</h3>
        </div>
      )}
      {children}
    </div>
  )
}

function AddressBlock({ title, data, onChange, countries = [], states = [], loadingCountries = false, loadingStates = false }) {
  const countryOptions = countries.map(country => ({
    value: country.name,
    label: country.name
  }))

  const stateOptions = states.map(state => ({
    value: state.name,
    label: state.name
  }))

  return (
    <div style={{ border:'1.5px solid #e5e7eb', borderRadius:10, padding:18, background:'#fafafa' }}>
      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:16 }}>
        <p style={{ margin:0, fontWeight:700, color:PRIMARY, fontSize:13.5 }}>{title}</p>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:13 }}>
        <div style={{ gridColumn:'1/-1' }}>
          <FloatField label="Entity Name" required>
            <FInput value={data.entity_name} onChange={e=>onChange('entity_name',e.target.value)} placeholder="Legal entity name" />
          </FloatField>
        </div>
        <FloatField label="Country">
          <CustomSelect
            value={data.country}
            onChange={(e) => {
              onChange('country', e.target.value)
              onChange('state', '')
            }}
            options={countryOptions}
            placeholder="Select a country"
            loading={loadingCountries}
          />
        </FloatField>
        <FloatField label="State">
          <CustomSelect
            value={data.state}
            onChange={(e) => onChange('state', e.target.value)}
            options={stateOptions}
            placeholder="Select a state"
            loading={loadingStates}
            disabled={!data.country}
          />
        </FloatField>
        <FloatField label="City">
          <FInput value={data.city} onChange={e=>onChange('city',e.target.value)} placeholder="Mumbai" />
        </FloatField>
        <div style={{ gridColumn:'1/-1' }}>
          <FloatField label="Address">
            <textarea 
              value={data.address_line} 
              onChange={e=>onChange('address_line',e.target.value)} 
              placeholder="Full address" 
              style={{ ...inputBase, height:72, resize:'vertical' }} 
            />
          </FloatField>
        </div>
        <FloatField label="Contact Person">
          <FInput value={data.contact_person} onChange={e=>onChange('contact_person',e.target.value)} placeholder="Ahmed Memon" />
        </FloatField>
        <FloatField label="Contact Number">
          <FInput value={data.contact_number} onChange={e=>onChange('contact_number',e.target.value)} placeholder="+91 98765 43210" />
        </FloatField>
        <div style={{ gridColumn:'1/-1' }}>
          <FloatField label="E-mail ID">
            <FInput value={data.contact_email} onChange={e=>onChange('contact_email',e.target.value)} placeholder="email@company.com" type="email" />
          </FloatField>
        </div>
      </div>
    </div>
  )
}

export default function AddCustomer({ basePath = '/employee/customers' }) {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  
  const [countries, setCountries] = useState([])
  const [mainFormStates, setMainFormStates] = useState([])
  const [billingStates, setBillingStates] = useState([])
  const [shippingStates, setShippingStates] = useState([])
  
  const [loadingCountries, setLoadingCountries] = useState(true)
  const [loadingMainStates, setLoadingMainStates] = useState(false)
  const [loadingBillingStates, setLoadingBillingStates] = useState(false)
  const [loadingShippingStates, setLoadingShippingStates] = useState(false)
  
  const [countryError, setCountryError] = useState(null)

  const [form, setForm] = useState({
    company_name:'', 
    tier:'C', 
    region:'',  
    country:'India', 
    state:'Maharashtra', 
    city:'',   
    telephone_primary:'', 
    telephone_secondary:'', 
    email:'', 
    website:'',
    pan_number:'', 
    gst_number:'', 
    credit_period_days:'',
    tds_percentage:'', 
    default_currency:'INR', 
    probable_products:'',
    is_customer: true, 
    is_supplier: false,
  })
  
  const [billing, setBilling] = useState({ ...emptyAddr })
  const [shipping, setShipping] = useState({ ...emptyAddr })
  const [sameAsBilling, setSame] = useState(false)
  const [pocs, setPocs] = useState([{ ...emptyPOC }])

  // Fetch countries from REST Countries API
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setLoadingCountries(true)
        setCountryError(null)
        
        const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2')
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        
        const formattedCountries = data
          .map(country => ({
            code: country.cca2,
            name: country.name.common
          }))
          .sort((a, b) => a.name.localeCompare(b.name))
        
        setCountries(formattedCountries)
        
      } catch (err) {
        console.error('Error fetching countries:', err)
        setCountryError('Failed to load countries. Using fallback list.')
        
        setCountries([
          { code: 'IN', name: 'India' },
          { code: 'US', name: 'United States' },
          { code: 'GB', name: 'United Kingdom' },
          { code: 'AE', name: 'United Arab Emirates' },
          { code: 'SG', name: 'Singapore' },
          { code: 'DE', name: 'Germany' },
          { code: 'FR', name: 'France' },
          { code: 'JP', name: 'Japan' },
          { code: 'AU', name: 'Australia' },
          { code: 'CA', name: 'Canada' },
        ])
      } finally {
        setLoadingCountries(false)
      }
    }

    fetchCountries()
  }, [])

  // Function to fetch states for a specific country
  const fetchStatesForCountry = async (countryName, setStatesCallback, setLoadingCallback) => {
    if (!countryName) {
      setStatesCallback([])
      return
    }

    try {
      setLoadingCallback(true)
      
      console.log('Fetching states for country:', countryName)
      
      // Using CountriesNow API to get states by country name
      const response = await fetch('https://countriesnow.space/api/v0.1/countries/states', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ country: countryName }),
      })
      
      const data = await response.json()
      console.log('API Response:', data)
      
      if (data.data && data.data.states && data.data.states.length > 0) {
        const formattedStates = data.data.states
          .map(state => ({
            code: state.state_code || state.name,
            name: state.name
          }))
          .sort((a, b) => a.name.localeCompare(b.name))
        
        setStatesCallback(formattedStates)
      } else {
        console.log('No states found for:', countryName)
        setStatesCallback([])
      }
      
    } catch (err) {
      console.error('Error fetching states:', err)
      setStatesCallback([])
    } finally {
      setLoadingCallback(false)
    }
  }

  // Fetch states when main form country changes
  useEffect(() => {
    if (form.country) {
      fetchStatesForCountry(form.country, setMainFormStates, setLoadingMainStates)
    } else {
      setMainFormStates([])
    }
  }, [form.country])

  // Fetch states when billing country changes
  useEffect(() => {
    if (billing.country) {
      fetchStatesForCountry(billing.country, setBillingStates, setLoadingBillingStates)
    } else {
      setBillingStates([])
    }
  }, [billing.country])

  // Fetch states when shipping country changes
  useEffect(() => {
    if (shipping.country && !sameAsBilling) {
      fetchStatesForCountry(shipping.country, setShippingStates, setLoadingShippingStates)
    } else if (sameAsBilling) {
      setShippingStates(billingStates)
    } else {
      setShippingStates([])
    }
  }, [shipping.country, sameAsBilling, billingStates])

  const sf = (k, v) => setForm(p => ({ ...p, [k]:v }))

  const updateBilling = (k, v) => {
    setBilling(p => ({ ...p, [k]:v }))
    if (sameAsBilling) setShipping(p => ({ ...p, [k]:v }))
  }
  
  const handleSame = checked => { 
    setSame(checked)
    if (checked) {
      setShipping({ ...billing })
      setShippingStates(billingStates)
    }
  }

  const validate = () => {
    const e = {}
    if (!form.company_name.trim()) e.company_name = 'Required'
    if (!form.telephone_primary.trim()) e.telephone_primary = 'Required'
    if (!form.email.trim()) e.email = 'Required'
    if (!form.website.trim()) e.website = 'Required'
    if (!form.country.trim()) e.country = 'Required'
    if (!form.state.trim()) e.state = 'Required'
    if (!form.city.trim()) e.city = 'Required'
    if (!form.pan_number.trim()) e.pan_number = 'Required'
    if (!form.gst_number.trim()) e.gst_number = 'Required'
    if (!billing.entity_name.trim()) e.billing_entity = 'Billing entity name required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const payload = {
        ...form,
        credit_period_days: form.credit_period_days ? parseInt(form.credit_period_days) : null,
        tds_percentage: form.tds_percentage ? parseFloat(form.tds_percentage) : null,
        billing_address: {
          ...billing,
          state: billing.state,
          city: billing.city,
        },
        shipping_address: sameAsBilling ? {
          ...billing,
          state: billing.state,
          city: billing.city,
        } : {
          ...shipping,
          state: shipping.state,
          city: shipping.city,
        },
        pocs: pocs.filter(p => p.name.trim()),
      }
      await api.post('/customers/', payload)
      navigate(`${basePath}/list`)
    } catch(e) {
      console.error(e)
      alert(e.response?.data ? JSON.stringify(e.response.data, null, 2) : 'Something went wrong')
    } finally { 
      setSaving(false) 
    }
  }

  const Checkbox = ({ checked, onChange, label }) => (
    <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', userSelect:'none' }}>
      <div onClick={onChange} style={{
        width:18, height:18, borderRadius:4, flexShrink:0,
        border:`2px solid ${checked?ACCENT:'#d1d5db'}`,
        background: checked?ACCENT:'#fff',
        display:'flex', alignItems:'center', justifyContent:'center', transition:'all .15s',
      }}>
        {checked && <Icon d={ic.check} size={10} color="#fff" />}
      </div>
      <span style={{ fontSize:13.5, color:'#374151', fontWeight:500 }}>{label}</span>
    </label>
  )

  const countryOptions = countries.map(country => ({
    value: country.name,
    label: country.name
  }))

  const mainFormStateOptions = mainFormStates.map(state => ({
    value: state.name,
    label: state.name
  }))

  return (
    <div style={{ fontFamily:FONT, maxWidth:980, margin:'0 auto' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing:border-box; }
        input:focus, select:focus, textarea:focus { outline:none; border-color:${ACCENT} !important; box-shadow:0 0 0 3px ${ACCENT}18 !important; }
        input, select, textarea { font-family:${FONT} !important; }
      `}</style>

      {/* PAGE HEADER */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:22 }}>
        <button 
          onClick={() => navigate(-1)} 
          style={{ width:34, height:34, borderRadius:8, border:'1.5px solid #e5e7eb', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}
        >
          <Icon d={ic.arrowLeft} size={16} color="#6b7280" />
        </button>
        <h1 style={{ margin:0, fontSize:22, fontWeight:700, color:PRIMARY }}>New Customer</h1>
      </div>

      {countryError && (
        <div style={{ 
          background: '#fef3c7', 
          border: '1px solid #f59e0b', 
          borderRadius: 8, 
          padding: '10px 15px', 
          marginBottom: 16,
          fontSize: 13,
          color: '#92400e',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <span>⚠️</span> {countryError}
        </div>
      )}

      {/* COMPANY DETAILS */}
      <Card title="Company Details">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:15 }}>
          <div style={{ gridColumn:'1/3' }}>
            <FloatField label="Company Name" required error={errors.company_name}>
              <FInput value={form.company_name} onChange={e=>sf('company_name',e.target.value)} placeholder="e.g. ApoCorp Pvt Ltd" />
            </FloatField>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <Checkbox checked={form.is_customer} onChange={()=>sf('is_customer',!form.is_customer)} label="Customer" />
            <Checkbox checked={form.is_supplier} onChange={()=>sf('is_supplier',!form.is_supplier)} label="Supplier" />
          </div>

          <FloatField label="Telephone Primary" required error={errors.telephone_primary}>
            <FInput value={form.telephone_primary} onChange={e=>sf('telephone_primary',e.target.value)} placeholder="020 - 998 998" />
          </FloatField>
          <FloatField label="Telephone Secondary">
            <FInput value={form.telephone_secondary} onChange={e=>sf('telephone_secondary',e.target.value)} placeholder="+91 87878 76767" />
          </FloatField>
          <FloatField label="Email ID" required error={errors.email}>
            <FInput value={form.email} onChange={e=>sf('email',e.target.value)} placeholder="Support@apocorp.com" type="email" />
          </FloatField>

          <FloatField label="Company Website" required error={errors.website}>
            <FInput value={form.website} onChange={e=>sf('website',e.target.value)} placeholder="Apocorp.com" />
          </FloatField>
          
          <FloatField label="Country" required error={errors.country}>
            <CustomSelect
              value={form.country}
              onChange={(e) => {
                sf('country', e.target.value)
                sf('state', '')
              }}
              options={countryOptions}
              placeholder="Select a country"
              loading={loadingCountries}
            />
          </FloatField>
          
          <FloatField label="Region">
            <FInput value={form.region} onChange={e=>sf('region',e.target.value)} placeholder="North, South, etc." />
          </FloatField>
          
          <FloatField label="State" required error={errors.state}>
            <CustomSelect
              value={form.state}
              onChange={(e) => sf('state', e.target.value)}
              options={mainFormStateOptions}
              placeholder="Select a state"
              loading={loadingMainStates}
              disabled={!form.country}
            />
          </FloatField>
          
          <FloatField label="City" required error={errors.city}>
            <FInput value={form.city} onChange={e=>sf('city',e.target.value)} placeholder="Mumbai" />
          </FloatField>
          
          <FloatField label="Tier">
            <FSelect value={form.tier} onChange={e=>sf('tier',e.target.value)}>
              {TIERS.map(([val,label]) => <option key={val} value={val}>{label}</option>)}
            </FSelect>
          </FloatField>

          <FloatField label="PAN Number" required error={errors.pan_number}>
            <FInput value={form.pan_number} onChange={e=>sf('pan_number',e.target.value)} placeholder="NA" />
          </FloatField>
          <FloatField label="GST Number" required error={errors.gst_number}>
            <FInput value={form.gst_number} onChange={e=>sf('gst_number',e.target.value)} placeholder="NA" />
          </FloatField>
          <FloatField label="Credit Period (Days)">
            <FInput value={form.credit_period_days} onChange={e=>sf('credit_period_days',e.target.value)} placeholder="NA" type="number" />
          </FloatField>
          <FloatField label="TDS %">
            <FInput value={form.tds_percentage} onChange={e=>sf('tds_percentage',e.target.value)} placeholder="NA" type="number" />
          </FloatField>
          <FloatField label="Currency" required>
            <FSelect value={form.default_currency} onChange={e=>sf('default_currency',e.target.value)}>
              {CURRENCY.map(c => <option key={c}>{c}</option>)}
            </FSelect>
          </FloatField>
        </div>
      </Card>

      {/* PROBABLE PURCHASE + BILLING & SHIPPING */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:16, marginBottom:16 }}>
        <div style={{ background:'#fff', borderRadius:12, padding:'22px 24px', boxShadow:'0 1px 8px rgba(0,0,0,.06)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, paddingBottom:12, borderBottom:'1px solid #f3f4f6' }}>
            <h3 style={{ fontSize:15, fontWeight:700, color:PRIMARY, margin:0 }}>Probable Purchase</h3>
            <button onClick={()=>sf('probable_products','')} style={{ fontSize:12.5, color:ACCENT, fontWeight:600, background:'none', border:'none', cursor:'pointer', fontFamily:FONT }}>Clear All</button>
          </div>
          <FloatField label="Probable Products / Purchases">
            <textarea 
              value={form.probable_products} 
              onChange={e=>sf('probable_products',e.target.value)}
              placeholder="e.g. SWAS Systems, Analysers…"
              style={{ ...inputBase, height:130, resize:'vertical' }} 
            />
          </FloatField>
        </div>

        <div style={{ background:'#fff', borderRadius:12, padding:'22px 24px', boxShadow:'0 1px 8px rgba(0,0,0,.06)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:18, paddingBottom:14, borderBottom:'1px solid #f3f4f6' }}>
            <h3 style={{ fontSize:15, fontWeight:700, color:PRIMARY, margin:0 }}>Billing &amp; Shipping Details</h3>
          </div>
          {errors.billing_entity && <p style={{ color:'#ef4444', fontSize:12.5, margin:'-8px 0 12px' }}>{errors.billing_entity}</p>}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <AddressBlock 
              title="📍 Bill To :" 
              data={billing} 
              onChange={updateBilling} 
              countries={countries}
              states={billingStates}
              loadingCountries={loadingCountries}
              loadingStates={loadingBillingStates}
            />
            <div>
              <label style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12, cursor:'pointer', userSelect:'none' }}>
                <div onClick={() => handleSame(!sameAsBilling)} style={{
                  width:17, height:17, borderRadius:4, flexShrink:0,
                  border:`2px solid ${sameAsBilling?ACCENT:'#d1d5db'}`,
                  background:sameAsBilling?ACCENT:'#fff',
                  display:'flex', alignItems:'center', justifyContent:'center', transition:'all .15s',
                }}>
                  {sameAsBilling && <Icon d={ic.check} size={9} color="#fff" />}
                </div>
                <span style={{ fontSize:13, color:'#6b7280', fontWeight:500 }}>Same as Billing Address</span>
              </label>
              <AddressBlock 
                title="🚚 Ship To :" 
                data={shipping} 
                onChange={(k,v) => { setSame(false); setShipping(p=>({...p,[k]:v})) }}
                countries={countries}
                states={shippingStates}
                loadingCountries={loadingCountries}
                loadingStates={loadingShippingStates}
              />
            </div>
          </div>
        </div>
      </div>

      {/* POINTS OF CONTACT */}
      <Card title="Points of Contact">
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {pocs.map((poc, i) => (
            <div key={i} style={{ background:'#f9fafb', border:'1.5px solid #e5e7eb', borderRadius:10, padding:16 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:13 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontSize:13, fontWeight:700, color:PRIMARY }}>Contact {i+1}</span>
                  <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', userSelect:'none' }}>
                    <div onClick={() => setPocs(p=>p.map((x,idx) => ({...x, is_primary:idx===i})))} style={{
                      width:15, height:15, borderRadius:'50%',
                      border:`2px solid ${poc.is_primary?ACCENT:'#d1d5db'}`,
                      background:poc.is_primary?ACCENT:'#fff',
                      display:'flex', alignItems:'center', justifyContent:'center', transition:'all .15s',
                    }}>
                      {poc.is_primary && <div style={{ width:5, height:5, borderRadius:'50%', background:'#fff' }} />}
                    </div>
                    <span style={{ fontSize:12, color:'#6b7280', fontWeight:500 }}>Primary</span>
                  </label>
                </div>
                {pocs.length > 1 && (
                  <button onClick={() => setPocs(p=>p.filter((_,idx)=>idx!==i))} style={{ width:26, height:26, borderRadius:6, border:'none', background:'#fee2e2', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Icon d={ic.x} size={12} color="#dc2626" />
                  </button>
                )}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <FloatField label="Full Name">
                  <FInput value={poc.name} onChange={e=>setPocs(p=>p.map((x,idx)=>idx===i?{...x,name:e.target.value}:x))} placeholder="Ahmed Memon" />
                </FloatField>
                <FloatField label="Designation">
                  <FInput value={poc.designation} onChange={e=>setPocs(p=>p.map((x,idx)=>idx===i?{...x,designation:e.target.value}:x))} placeholder="VP Procurement" />
                </FloatField>
                <FloatField label="Email">
                  <FInput value={poc.email} onChange={e=>setPocs(p=>p.map((x,idx)=>idx===i?{...x,email:e.target.value}:x))} placeholder="am@company.com" type="email" />
                </FloatField>
                <FloatField label="Phone">
                  <FInput value={poc.phone} onChange={e=>setPocs(p=>p.map((x,idx)=>idx===i?{...x,phone:e.target.value}:x))} placeholder="+91 98765 43210" />
                </FloatField>
              </div>
            </div>
          ))}
          <button onClick={() => setPocs(p=>[...p,{...emptyPOC}])} style={{
            display:'flex', alignItems:'center', gap:6,
            padding:'8px 16px', borderRadius:8,
            border:`1.5px dashed ${ACCENT}`, background:`${ACCENT}08`,
            color:ACCENT, fontSize:13, fontWeight:600,
            cursor:'pointer', fontFamily:FONT, alignSelf:'flex-start',
          }}>
            <Icon d={ic.plus} size={13} color={ACCENT} /> Add Another Contact
          </button>
        </div>
      </Card>

      {/* ACTIONS */}
      <div style={{ display:'flex', gap:12, justifyContent:'flex-end', padding:'8px 0 40px' }}>
        <button onClick={() => navigate(-1)} style={{ padding:'11px 28px', borderRadius:9, border:'1.5px solid #e5e7eb', background:'#fff', color:'#4b5563', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:FONT }}>
          Cancel
        </button>
        <button onClick={handleSubmit} disabled={saving} style={{
          padding:'11px 32px', borderRadius:9, border:'none',
          background: saving ? `${PRIMARY}88` : PRIMARY,
          color:'#fff', fontSize:14, fontWeight:700,
          cursor: saving ? 'not-allowed' : 'pointer', fontFamily:FONT,
          boxShadow:`0 3px 12px ${PRIMARY}40`, transition:'all .2s',
        }}>
          {saving ? 'Saving…' : 'Add Customer'}
        </button>
      </div>
    </div>
  )
}