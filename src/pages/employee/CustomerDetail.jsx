// CustomerDetail.jsx - Complete updated version

import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../api/axios'

const PRIMARY = '#122C41'
const ACCENT  = '#1e88e5'
const FONT    = "'Inter', 'Segoe UI', sans-serif"

const Icon = ({ d, size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
)

const ic = {
  arrowLeft: 'M19 12H5M12 19l-7-7 7-7',
  edit:      'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z',
  lock:      'M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4',
  unlock:    'M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 9.9-1',
  check:     'M20 6L9 17l-5-5',
  x:         'M18 6L6 18M6 6l12 12',
  user:      'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  mail:      'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6',
  phone:     'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z',
  plus:      'M12 5v14M5 12h14',
  file:      'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6',
  grid:      'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  shop:      'M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0',
  calendar:  'M8 2v4M16 2v4M3 10h18M21 4h-3M3 4h3M5 4h2M17 4h2M19 4h2M3 8h18M3 20h18M8 14h8M8 18h4',
  building:  'M3 21h18M9 8h1M12 8h1M15 8h1M9 12h1M12 12h1M15 12h1M9 16h1M12 16h1M15 16h1',
  tag:       'M7 7h.01M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z',
  dollar:    'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  globe2:    'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z',
  credit:    'M3 10h18M7 15h1M11 15h1M15 15h1M7 18h1M11 18h1M15 18h1M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  percent:   'M19 5L5 19M9 8.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zM18 15.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z',
}

const TIERS    = [['A','Tier A – Premium'],['B','Tier B – Standard'],['C','Tier C – Basic']]
const CURRENCY = ['INR','USD','EUR','GBP','AED']
const fmt      = n => new Intl.NumberFormat('en-IN').format(n ?? 0)

const inputBase = {
  width:'100%', padding:'10px 13px',
  border:'1.5px solid #e5e7eb', borderRadius:8,
  fontSize:13.5, fontFamily:FONT, color:'#111827',
  background:'#fff', transition:'border .15s',
  boxSizing:'border-box',
}

const emptyAddr = { entity_name:'', country:'India', state:'', city:'', address_line:'', contact_person:'', contact_email:'', contact_number:'' }
const emptyPOC  = { name:'', email:'', phone:'', designation:'', is_primary:false }

// ========== CONFIRM MODAL ==========
function ConfirmModal({ open, onClose, onConfirm, isLocked, customerName, loading }) {
  if (!open) return null
  const action = isLocked ? 'Unlock' : 'Lock'
  const accent = isLocked ? '#16a34a' : '#dc2626'
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1100, backdropFilter:'blur(3px)' }}>
      <div style={{ background:'#fff', borderRadius:16, padding:'36px 40px', maxWidth:410, width:'90%', boxShadow:'0 20px 50px rgba(0,0,0,.16)' }}>
        <div style={{ width:56, height:56, borderRadius:'50%', background:isLocked?'#f0fdf4':'#fef2f2', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
          <Icon d={isLocked?ic.unlock:ic.lock} size={24} color={accent} />
        </div>
        <h2 style={{ textAlign:'center', fontSize:19, fontWeight:700, color:'#111827', margin:'0 0 10px' }}>{action} Customer Account?</h2>
        <p style={{ textAlign:'center', color:'#6b7280', fontSize:13.5, lineHeight:1.6, margin:'0 0 24px' }}>
          {isLocked
            ? <>Unlocking <strong style={{ color:'#111827' }}>{customerName}</strong> will allow new transactions on this account.</>
            : <>Locking <strong style={{ color:'#111827' }}>{customerName}</strong> will prevent any new transactions from being entered.</>}
        </p>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:'11px 0', borderRadius:9, border:'1.5px solid #e5e7eb', background:'#fff', color:'#4b5563', fontSize:13.5, fontWeight:600, cursor:'pointer', fontFamily:FONT }}>Cancel</button>
          <button onClick={onConfirm} disabled={loading} style={{ flex:1, padding:'11px 0', borderRadius:9, border:'none', background:accent, color:'#fff', fontSize:13.5, fontWeight:700, cursor:loading?'not-allowed':'pointer', opacity:loading?.7:1, fontFamily:FONT }}>
            {loading ? 'Please wait…' : `${action} Account`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ========== EDIT MODAL ==========
function EditModal({ customer, onClose, onSaved }) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    company_name: customer.company_name||'', tier: customer.tier||'C',
    region: customer.region||'', country: customer.country||'',
    state: customer.state||'', city: customer.city||'',
    telephone_primary: customer.telephone_primary||'', telephone_secondary: customer.telephone_secondary||'',
    email: customer.email||'', website: customer.website||'',
    pan_number: customer.pan_number||'', gst_number: customer.gst_number||'',
    credit_period_days: customer.credit_period_days??'', tds_percentage: customer.tds_percentage??'',
    probable_products: customer.probable_products||'', default_currency: customer.default_currency||'INR',
    is_customer: customer.is_customer??true, is_supplier: customer.is_supplier??false,
  })

  const billingRaw  = customer.addresses?.find(a=>a.address_type==='BILLING')  || {}
  const shippingRaw = customer.addresses?.find(a=>a.address_type==='SHIPPING') || {}
  const [billing, setBilling]   = useState({ ...emptyAddr, ...billingRaw })
  const [shipping, setShipping] = useState({ ...emptyAddr, ...shippingRaw })
  const [pocs, setPocs] = useState(
    customer.pocs?.length
      ? customer.pocs.map(p => ({ name:p.name||'', email:p.email||'', phone:p.phone||'', designation:p.designation||'', is_primary:p.is_primary||false }))
      : [{ ...emptyPOC }]
  )

  const sf = (k,v) => setForm(p => ({ ...p, [k]:v }))

  const handleSave = async () => {
    if (!form.company_name.trim()) { alert('Company name is required'); return }
    setSaving(true)
    try {
      const payload = {
        ...form,
        credit_period_days: form.credit_period_days ? parseInt(form.credit_period_days)  : null,
        tds_percentage:     form.tds_percentage     ? parseFloat(form.tds_percentage)    : null,
        billing_address:  billing,
        shipping_address: shipping,
        pocs: pocs.filter(p => p.name.trim()),
      }
      await api.patch(`/customers/${customer.id}/`, payload)
      onSaved()
    } catch(e) {
      console.error(e)
      alert(e.response?.data ? JSON.stringify(e.response.data, null, 2) : 'Something went wrong')
    } finally { setSaving(false) }
  }

  const Checkbox = ({ checked, onToggle, label }) => (
    <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', userSelect:'none' }}>
      <div onClick={onToggle} style={{ width:18, height:18, borderRadius:4, flexShrink:0, border:`2px solid ${checked?ACCENT:'#d1d5db'}`, background:checked?ACCENT:'#fff', display:'flex', alignItems:'center', justifyContent:'center', transition:'all .15s' }}>
        {checked && <Icon d={ic.check} size={10} color="#fff" />}
      </div>
      <span style={{ fontSize:13.5, color:'#374151', fontWeight:500 }}>{label}</span>
    </label>
  )

  const EField = ({ label, children }) => (
    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
      <label style={{ fontSize:11, fontWeight:600, color:'#9ca3af', letterSpacing:'.05em', textTransform:'uppercase' }}>{label}</label>
      {children}
    </div>
  )

  const AddrFields = ({ title, data, onChange }) => (
    <div style={{ background:'#f9fafb', borderRadius:10, border:'1.5px solid #e5e7eb', padding:16 }}>
      <p style={{ margin:'0 0 12px', fontSize:13.5, fontWeight:700, color:PRIMARY }}>{title}</p>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <div style={{ gridColumn:'1/-1' }}><EField label="Entity Name"><input value={data.entity_name} onChange={e=>onChange('entity_name',e.target.value)} style={inputBase} /></EField></div>
        <EField label="Country"><input value={data.country} onChange={e=>onChange('country',e.target.value)} style={inputBase} /></EField>
        <EField label="State"><input value={data.state} onChange={e=>onChange('state',e.target.value)} style={inputBase} /></EField>
        <EField label="City"><input value={data.city} onChange={e=>onChange('city',e.target.value)} style={inputBase} /></EField>
        <div style={{ gridColumn:'1/-1' }}><EField label="Address"><textarea value={data.address_line} onChange={e=>onChange('address_line',e.target.value)} style={{ ...inputBase, height:64, resize:'vertical' }} /></EField></div>
        <EField label="Contact Person"><input value={data.contact_person} onChange={e=>onChange('contact_person',e.target.value)} style={inputBase} /></EField>
        <EField label="Contact Number"><input value={data.contact_number} onChange={e=>onChange('contact_number',e.target.value)} style={inputBase} /></EField>
        <div style={{ gridColumn:'1/-1' }}><EField label="Email"><input value={data.contact_email} onChange={e=>onChange('contact_email',e.target.value)} style={inputBase} /></EField></div>
      </div>
    </div>
  )

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.5)', display:'flex', alignItems:'flex-start', justifyContent:'center', zIndex:1000, backdropFilter:'blur(4px)', overflowY:'auto', padding:'28px 16px' }}>
      <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:860, boxShadow:'0 20px 56px rgba(0,0,0,.18)', marginBottom:30 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 26px', borderBottom:'1px solid #f3f4f6' }}>
          <div>
            <h2 style={{ margin:0, fontSize:19, fontWeight:700, color:PRIMARY }}>Edit Customer</h2>
            <p style={{ margin:'3px 0 0', fontSize:13, color:'#6b7280' }}>
              ID: <span style={{ fontFamily:'monospace', fontWeight:700, color:ACCENT }}>{customer.customer_code}</span> — read-only
            </p>
          </div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:8, border:'1.5px solid #e5e7eb', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Icon d={ic.x} size={15} color="#6b7280" />
          </button>
        </div>

        <div style={{ padding:'22px 26px', display:'flex', flexDirection:'column', gap:18 }}>
          <ESection title="Company Details">
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:13 }}>
              <div style={{ gridColumn:'1/3' }}><EField label="Company Name *"><input value={form.company_name} onChange={e=>sf('company_name',e.target.value)} style={inputBase} /></EField></div>
              <EField label="Account Type">
                <div style={{ display:'flex', flexDirection:'column', gap:7, paddingTop:2 }}>
                  <Checkbox checked={form.is_customer} onToggle={()=>sf('is_customer',!form.is_customer)} label="Customer" />
                  <Checkbox checked={form.is_supplier} onToggle={()=>sf('is_supplier',!form.is_supplier)} label="Supplier" />
                </div>
              </EField>
              <EField label="Primary Phone"><input value={form.telephone_primary} onChange={e=>sf('telephone_primary',e.target.value)} style={inputBase} /></EField>
              <EField label="Secondary Phone"><input value={form.telephone_secondary} onChange={e=>sf('telephone_secondary',e.target.value)} style={inputBase} /></EField>
              <EField label="Email"><input value={form.email} onChange={e=>sf('email',e.target.value)} type="email" style={inputBase} /></EField>
              <EField label="Website"><input value={form.website} onChange={e=>sf('website',e.target.value)} style={inputBase} /></EField>
              <EField label="Country"><input value={form.country} onChange={e=>sf('country',e.target.value)} style={inputBase} /></EField>
              <EField label="State"><input value={form.state} onChange={e=>sf('state',e.target.value)} style={inputBase} /></EField>
              <EField label="City"><input value={form.city} onChange={e=>sf('city',e.target.value)} style={inputBase} /></EField>
              <EField label="Region"><input value={form.region} onChange={e=>sf('region',e.target.value)} style={inputBase} /></EField>
              <EField label="Tier">
                <select value={form.tier} onChange={e=>sf('tier',e.target.value)} style={inputBase}>
                  {TIERS.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </EField>
              <EField label="PAN Number"><input value={form.pan_number} onChange={e=>sf('pan_number',e.target.value)} style={inputBase} /></EField>
              <EField label="GST Number"><input value={form.gst_number} onChange={e=>sf('gst_number',e.target.value)} style={inputBase} /></EField>
              <EField label="Credit Period (Days)"><input value={form.credit_period_days} onChange={e=>sf('credit_period_days',e.target.value)} type="number" style={inputBase} /></EField>
              <EField label="TDS %"><input value={form.tds_percentage} onChange={e=>sf('tds_percentage',e.target.value)} type="number" step="0.01" style={inputBase} /></EField>
              <EField label="Currency">
                <select value={form.default_currency} onChange={e=>sf('default_currency',e.target.value)} style={inputBase}>
                  {CURRENCY.map(c => <option key={c}>{c}</option>)}
                </select>
              </EField>
              <div style={{ gridColumn:'1/-1' }}>
                <EField label="Probable Products"><textarea value={form.probable_products} onChange={e=>sf('probable_products',e.target.value)} style={{ ...inputBase, height:66, resize:'vertical' }} /></EField>
              </div>
            </div>
          </ESection>

          <ESection title="Billing & Shipping">
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <AddrFields title="📍 Bill To" data={billing} onChange={(k,v)=>setBilling(p=>({...p,[k]:v}))} />
              <AddrFields title="🚚 Ship To" data={shipping} onChange={(k,v)=>setShipping(p=>({...p,[k]:v}))} />
            </div>
          </ESection>

          <ESection title="Points of Contact">
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {pocs.map((poc,i) => (
                <div key={i} style={{ background:'#f9fafb', border:'1.5px solid #e5e7eb', borderRadius:10, padding:14 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ fontSize:13, fontWeight:700, color:PRIMARY }}>Contact {i+1}</span>
                      <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', userSelect:'none' }}>
                        <div onClick={() => setPocs(p=>p.map((x,idx)=>({...x,is_primary:idx===i})))} style={{ width:14, height:14, borderRadius:'50%', border:`2px solid ${poc.is_primary?ACCENT:'#d1d5db'}`, background:poc.is_primary?ACCENT:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
                          {poc.is_primary && <div style={{ width:4, height:4, borderRadius:'50%', background:'#fff' }} />}
                        </div>
                        <span style={{ fontSize:12, color:'#6b7280' }}>Primary</span>
                      </label>
                    </div>
                    {pocs.length > 1 && <button onClick={() => setPocs(p=>p.filter((_,idx)=>idx!==i))} style={{ width:24, height:24, borderRadius:6, border:'none', background:'#fee2e2', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><Icon d={ic.x} size={11} color="#dc2626" /></button>}
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                    <EField label="Name"><input value={poc.name} onChange={e=>setPocs(p=>p.map((x,idx)=>idx===i?{...x,name:e.target.value}:x))} style={inputBase} /></EField>
                    <EField label="Designation"><input value={poc.designation} onChange={e=>setPocs(p=>p.map((x,idx)=>idx===i?{...x,designation:e.target.value}:x))} style={inputBase} /></EField>
                    <EField label="Email"><input value={poc.email} onChange={e=>setPocs(p=>p.map((x,idx)=>idx===i?{...x,email:e.target.value}:x))} type="email" style={inputBase} /></EField>
                    <EField label="Phone"><input value={poc.phone} onChange={e=>setPocs(p=>p.map((x,idx)=>idx===i?{...x,phone:e.target.value}:x))} style={inputBase} /></EField>
                  </div>
                </div>
              ))}
              <button onClick={() => setPocs(p=>[...p,{...emptyPOC}])} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:8, border:`1.5px dashed ${ACCENT}`, background:`${ACCENT}08`, color:ACCENT, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:FONT, alignSelf:'flex-start' }}>
                <Icon d={ic.plus} size={13} color={ACCENT} /> Add Contact
              </button>
            </div>
          </ESection>
        </div>

        <div style={{ display:'flex', gap:10, justifyContent:'flex-end', padding:'16px 26px', borderTop:'1px solid #f3f4f6' }}>
          <button onClick={onClose} style={{ padding:'10px 22px', borderRadius:9, border:'1.5px solid #e5e7eb', background:'#fff', color:'#4b5563', fontSize:13.5, fontWeight:600, cursor:'pointer', fontFamily:FONT }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ padding:'10px 26px', borderRadius:9, border:'none', background:saving?`${PRIMARY}88`:PRIMARY, color:'#fff', fontSize:13.5, fontWeight:700, cursor:saving?'not-allowed':'pointer', fontFamily:FONT, boxShadow:`0 3px 12px ${PRIMARY}40` }}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ESection({ title, children }) {
  return (
    <div>
      <h4 style={{ margin:'0 0 13px', fontSize:13.5, fontWeight:700, color:PRIMARY, paddingBottom:8, borderBottom:'1px solid #f3f4f6' }}>{title}</h4>
      {children}
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display:'flex', padding:'8px 0', borderBottom:'1px solid #f9fafb' }}>
      <span style={{ minWidth:140, color:'#6b7280', fontSize:13, fontWeight:500 }}>{label} :</span>
      <span style={{ color:'#111827', fontSize:13.5, fontWeight:500 }}>{value || '—'}</span>
    </div>
  )
}

function AddressView({ title, address }) {
  if (!address) return null
  const fullAddress = [address.address_line, address.city, address.state, address.country].filter(Boolean).join(', ')
  return (
    <div style={{ marginBottom:22 }}>
      <h3 style={{ fontSize:14.5, fontWeight:700, color:PRIMARY, margin:'0 0 14px', paddingBottom:10, borderBottom:'1px solid #f3f4f6' }}>{title}</h3>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'2px 48px' }}>
        <InfoRow label="Entity Name"    value={address.entity_name} />
        <InfoRow label="Contact Person" value={address.contact_person} />
        <InfoRow label="E-mail ID"      value={address.contact_email} />
        <InfoRow label="Contact Number" value={address.contact_number} />
        <div style={{ gridColumn:'1/-1' }}>
          <InfoRow label="Address" value={fullAddress} />
        </div>
      </div>
    </div>
  )
}

// ========== MAIN COMPONENT ==========
export default function CustomerDetail({ basePath = '/employee/customers' }) {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [lockModal, setLockModal] = useState({ open:false, loading:false })

  const load = () => {
    setLoading(true)
    api.get(`/customers/${id}/`)
      .then(r => { setCustomer(r.data); setLoading(false) })
      .catch(() => setLoading(false))
  }
  useEffect(() => { load() }, [id])

  const handleLock = async () => {
    setLockModal(p => ({ ...p, loading:true }))
    try {
      await api.post(`/customers/${id}/${customer.is_locked?'unlock':'lock'}/`)
      await load()
      setLockModal({ open:false, loading:false })
    } catch(e) { console.error(e); setLockModal(p=>({...p,loading:false})) }
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:320, fontFamily:FONT }}>
      <div style={{ width:36, height:36, border:`3px solid #e5e7eb`, borderTopColor:PRIMARY, borderRadius:'50%', animation:'spin .8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
  if (!customer) return <div style={{ padding:40, textAlign:'center', color:'#9ca3af', fontFamily:FONT }}>Customer not found.</div>

  const billing  = customer.addresses?.find(a => a.address_type === 'BILLING')
  const shipping = customer.addresses?.find(a => a.address_type === 'SHIPPING')

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing:border-box; }
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        input:focus, select:focus, textarea:focus { outline:none; border-color:${ACCENT} !important; box-shadow:0 0 0 3px ${ACCENT}18 !important; }
        input,select,textarea { font-family:${FONT} !important; }
      `}</style>

      <div style={{ fontFamily:FONT, maxWidth:1200, margin:'0 auto', padding:'0 20px' }}>

        {/* ── PAGE HEADER ── */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <button onClick={() => navigate(-1)} style={{ width:34, height:34, borderRadius:8, border:'1.5px solid #e5e7eb', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Icon d={ic.arrowLeft} size={16} color="#6b7280" />
            </button>
            <h1 style={{ margin:0, fontSize:22, fontWeight:700, color:PRIMARY }}>Customer Detail</h1>
          </div>
          <button onClick={() => setEditOpen(true)} style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 18px', borderRadius:9, border:`1.5px solid ${PRIMARY}`, background:'#fff', color:PRIMARY, fontSize:13.5, fontWeight:600, cursor:'pointer', fontFamily:FONT }}>
            <Icon d={ic.edit} size={14} color={PRIMARY} /> Edit Details
          </button>
        </div>

        {/* ── TOP SECTION: Basic Info and Metrics ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:16, marginBottom:16 }}>
          
          {/* Company Basic Info */}
          <div style={card}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
              <Icon d={ic.building} size={18} color={PRIMARY} />
              <span style={{ fontSize:14, fontWeight:700, color:PRIMARY }}>Company Information</span>
            </div>
            <InfoRow label="Company Name" value={customer.company_name} />
            <InfoRow label="Customer Code" value={customer.customer_code} />
            <InfoRow label="Tier" value={TIERS.find(t => t[0] === customer.tier)?.[1] || customer.tier} />
            <InfoRow label="Account Type" value={[customer.is_customer && 'Customer', customer.is_supplier && 'Supplier'].filter(Boolean).join(', ') || '—'} />
            <InfoRow label="Default Currency" value={customer.default_currency || 'INR'} />
          </div>

          {/* Contact Information */}
          <div style={card}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
              <Icon d={ic.phone} size={18} color={PRIMARY} />
              <span style={{ fontSize:14, fontWeight:700, color:PRIMARY }}>Contact Information</span>
            </div>
            <InfoRow label="Primary Phone" value={customer.telephone_primary} />
            <InfoRow label="Secondary Phone" value={customer.telephone_secondary} />
            <InfoRow label="Email" value={customer.email} />
            <InfoRow label="Website" value={customer.website} />
          </div>

          {/* Financial & Tax Information */}
          <div style={card}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
              <Icon d={ic.dollar} size={18} color={PRIMARY} />
              <span style={{ fontSize:14, fontWeight:700, color:PRIMARY }}>Financial & Tax</span>
            </div>
            <InfoRow label="PAN Number" value={customer.pan_number} />
            <InfoRow label="GST Number" value={customer.gst_number} />
            <InfoRow label="Credit Period" value={customer.credit_period_days ? `${customer.credit_period_days} days` : '—'} />
            <InfoRow label="TDS Percentage" value={customer.tds_percentage ? `${customer.tds_percentage}%` : '—'} />
          </div>
        </div>

        {/* ── LOCATION & METRICS SECTION ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:16, marginBottom:16 }}>
          
          {/* Location Details */}
          <div style={card}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
              <Icon d={ic.globe2} size={18} color={PRIMARY} />
              <span style={{ fontSize:14, fontWeight:700, color:PRIMARY }}>Location</span>
            </div>
            <InfoRow label="Region" value={customer.region} />
            <InfoRow label="Country" value={customer.country} />
            <InfoRow label="State" value={customer.state} />
            <InfoRow label="City" value={customer.city} />
          </div>

          {/* Business Metrics */}
          <div style={card}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
              <Icon d={ic.trendUp} size={18} color={PRIMARY} />
              <span style={{ fontSize:14, fontWeight:700, color:PRIMARY }}>Business Metrics</span>
            </div>
            <InfoRow label="Life Time Value" value={`₹${fmt(customer.lifetime_value)}`} />
            <InfoRow label="Avg Order Size" value={`₹${fmt(customer.avg_order_size)}`} />
            <InfoRow label="Current Projects" value={customer.current_projects || 0} />
          </div>

          {/* Account Status */}
          <div style={card}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
              <Icon d={ic.lock} size={18} color={PRIMARY} />
              <span style={{ fontSize:14, fontWeight:700, color:PRIMARY }}>Account Status</span>
            </div>
            <div style={{ padding:'8px 0', borderBottom:'1px solid #f9fafb' }}>
              <span style={{ minWidth:140, color:'#6b7280', fontSize:13, fontWeight:500, display:'inline-block' }}>Status :</span>
              <span style={{ color: customer.is_locked ? '#dc2626' : '#16a34a', fontSize:13.5, fontWeight:700, marginLeft:8 }}>
                {customer.is_locked ? 'LOCKED' : 'ACTIVE'}
              </span>
            </div>
            {customer.locked_at && (
              <InfoRow label="Locked At" value={new Date(customer.locked_at).toLocaleString()} />
            )}
            {customer.locked_by && (
              <InfoRow label="Locked By" value={customer.locked_by.username || customer.locked_by.email} />
            )}
            <InfoRow label="Created At" value={new Date(customer.created_at).toLocaleDateString()} />
            <InfoRow label="Last Updated" value={new Date(customer.updated_at).toLocaleDateString()} />
          </div>
        </div>

        {/* ── PROBABLE PRODUCTS ── */}
        {customer.probable_products && (
          <div style={{ ...card, marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
              <Icon d={ic.tag} size={16} color={PRIMARY} />
              <span style={{ fontSize:14, fontWeight:700, color:PRIMARY }}>Probable Products / Services</span>
            </div>
            <div style={{ fontSize:13.5, color:'#374151', lineHeight:1.6, whiteSpace:'pre-wrap' }}>
              {customer.probable_products}
            </div>
          </div>
        )}

        {/* ── BILLING ADDRESS ── */}
        {billing && (
          <div style={{ ...card, marginBottom:16 }}>
            <AddressView title="Billing Address" address={billing} />
          </div>
        )}

        {/* ── SHIPPING ADDRESS ── */}
        {shipping && (
          <div style={{ ...card, marginBottom:16 }}>
            <AddressView title="Shipping Address" address={shipping} />
          </div>
        )}

        {/* ── POINTS OF CONTACT ── */}
        {customer.pocs?.length > 0 && (
          <div style={{ ...card, marginBottom:16 }}>
            <h3 style={{ fontSize:14.5, fontWeight:700, color:PRIMARY, margin:'0 0 14px', paddingBottom:10, borderBottom:'1px solid #f3f4f6' }}>Points of Contact</h3>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:12 }}>
              {customer.pocs.map((poc,i) => (
                <div key={i} style={{ padding:'14px 16px', background:'#f9fafb', borderRadius:10, border:'1.5px solid #e5e7eb' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:10 }}>
                    <div style={{ width:32, height:32, borderRadius:'50%', background:PRIMARY, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <Icon d={ic.user} size={14} color="#fff" />
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, color:'#111827', fontSize:13.5 }}>{poc.name || '—'}</div>
                      <div style={{ fontSize:12, color:'#6b7280' }}>{poc.designation || '—'}</div>
                    </div>
                    {poc.is_primary && <span style={{ fontSize:11, fontWeight:700, color:ACCENT, background:`${ACCENT}12`, padding:'2px 8px', borderRadius:99 }}>Primary</span>}
                  </div>
                  {poc.email && <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12.5, color:'#374151', marginBottom:4 }}><Icon d={ic.mail} size={12} color="#9ca3af" />{poc.email}</div>}
                  {poc.phone && <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12.5, color:'#374151' }}><Icon d={ic.phone} size={12} color="#9ca3af" />{poc.phone}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── LOCK TOGGLE ── */}
        <div style={{ ...card, marginBottom:32 }}>
          <label onClick={() => setLockModal({ open:true, loading:false })} style={{ display:'flex', alignItems:'flex-start', gap:12, cursor:'pointer', userSelect:'none' }}>
            <div style={{ width:20, height:20, marginTop:1, borderRadius:4, flexShrink:0, border:`2px solid ${customer.is_locked?ACCENT:'#d1d5db'}`, background:customer.is_locked?ACCENT:'#fff', display:'flex', alignItems:'center', justifyContent:'center', transition:'all .15s' }}>
              {customer.is_locked && <Icon d={ic.check} size={10} color="#fff" />}
            </div>
            <div>
              <div style={{ fontWeight:600, color:'#111827', fontSize:13.5 }}>Lock this customer account</div>
              <div style={{ color:'#6b7280', fontSize:13, marginTop:2 }}>If the A/c is locked, transactions cannot be created for this account</div>
            </div>
          </label>
        </div>
      </div>

      {editOpen && (
        <EditModal customer={customer} onClose={() => setEditOpen(false)} onSaved={() => { setEditOpen(false); load() }} />
      )}
      <ConfirmModal
        open={lockModal.open}
        onClose={() => setLockModal({open:false,loading:false})}
        onConfirm={handleLock}
        isLocked={customer?.is_locked}
        customerName={customer?.company_name}
        loading={lockModal.loading}
      />
    </>
  )
}

const card = {
  background:'#fff', borderRadius:12, padding:'20px 22px',
  boxShadow:'0 1px 8px rgba(0,0,0,.06)',
}