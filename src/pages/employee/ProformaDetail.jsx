import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../api/axios'

const PRIMARY = '#122C41'
const ACCENT  = '#1e88e5'
const FONT    = "'Inter', 'Segoe UI', sans-serif"

const Icon = ({ d, size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)
const ic = {
  arrowLeft: 'M19 12H5M12 19l-7-7 7-7',
  print:     'M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z',
  send:      'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
  dollar:    'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  check:     'M20 6L9 17l-5-5',
  x:         'M18 6L6 18M6 6l12 12',
  save:      'M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8',
  building:  'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10',
  user:      'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
}

const fmt = n => new Intl.NumberFormat('en-IN').format(Number(n) ?? 0)

function numToWords(n) {
  if (!n || isNaN(n)) return ''
  const num = Math.round(Number(n))
  if (num === 0) return 'Zero'
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine',
    'Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen']
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety']
  function convert(n) {
    if (n < 20) return ones[n]
    if (n < 100) return tens[Math.floor(n/10)] + (n%10 ? ' '+ones[n%10] : '')
    if (n < 1000) return ones[Math.floor(n/100)] + ' Hundred' + (n%100 ? ' '+convert(n%100) : '')
    if (n < 100000) return convert(Math.floor(n/1000)) + ' Thousand' + (n%1000 ? ' '+convert(n%1000) : '')
    if (n < 10000000) return convert(Math.floor(n/100000)) + ' Lakh' + (n%100000 ? ' '+convert(n%100000) : '')
    return convert(Math.floor(n/10000000)) + ' Crore' + (n%10000000 ? ' '+convert(n%10000000) : '')
  }
  return convert(num) + ' Only'
}

// ── Pure compute from line items — no stale closure risk ──────────────────────
function computeLineTotals(items) {
  let subTotal = 0, totalTax = 0
  for (const item of items) {
    const qty    = Number(item.quantity)    || 0
    const price  = Number(item.unit_price)  || 0
    const taxPct = Number(item.tax_percent) || 0
    const excl   = qty * price
    subTotal += excl
    totalTax += excl * (taxPct / 100)
  }
  return { subTotal, totalTax, grandTotal: subTotal + totalTax }
}

// Compute deduction amounts from percentages against a base total
function computeDeductions(grandTotal, ffPct, discPct, advPct) {
  const base    = Number(grandTotal) || 0
  const ffAmt   = base * (Number(ffPct)   || 0) / 100
  const discAmt = base * (Number(discPct) || 0) / 100
  const advAmt  = base * (Number(advPct)  || 0) / 100
  const receivable = Math.max(base - ffAmt - discAmt - advAmt, 0)
  return { ffAmt, discAmt, advAmt, receivable }
}

// ── Shared input components ───────────────────────────────────────────────────
const inputBase = {
  width:'100%', padding:'10px 13px', border:'1.5px solid #e5e7eb',
  borderRadius:8, fontSize:13.5, fontFamily:FONT, color:'#111827',
  background:'#fff', transition:'border .15s', boxSizing:'border-box',
}

function FInput({ label, value, onChange, type='text', readOnly=false, placeholder='' }) {
  return (
    <div style={{ position:'relative' }}>
      {label && <span style={{ position:'absolute', top:-9, left:10, background:readOnly?'#f9fafb':'#fff', padding:'0 4px', fontSize:11, fontWeight:600, color:'#9ca3af', fontFamily:FONT, zIndex:1, letterSpacing:'.04em', textTransform:'uppercase', whiteSpace:'nowrap' }}>{label}</span>}
      <input type={type} value={value??''} onChange={onChange} readOnly={readOnly} placeholder={placeholder}
        style={{ ...inputBase, background:readOnly?'#f9fafb':'#fff', cursor:readOnly?'default':'text' }} />
    </div>
  )
}

function FSelect({ label, value, onChange, children }) {
  return (
    <div style={{ position:'relative' }}>
      {label && <span style={{ position:'absolute', top:-9, left:10, background:'#fff', padding:'0 4px', fontSize:11, fontWeight:600, color:'#9ca3af', fontFamily:FONT, zIndex:1, letterSpacing:'.04em', textTransform:'uppercase', whiteSpace:'nowrap' }}>{label}</span>}
      <select value={value??''} onChange={onChange}
        style={{ ...inputBase, appearance:'none', backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat:'no-repeat', backgroundPosition:'right 12px center', paddingRight:36 }}>
        {children}
      </select>
    </div>
  )
}

// A read-only display row used in Amount Detail
function AmountRow({ label, amount, sub, highlight }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid #f3f4f6' }}>
      <div>
        <div style={{ fontSize:13.5, color: highlight ? PRIMARY : '#374151', fontWeight: highlight ? 700 : 500 }}>{label}</div>
        {sub && <div style={{ fontSize:11.5, color:'#9ca3af', marginTop:2 }}>{sub}</div>}
      </div>
      <div style={{ fontSize: highlight ? 16 : 13.5, fontWeight: highlight ? 700 : 600, color: highlight ? PRIMARY : '#374151', minWidth:130, textAlign:'right' }}>
        ₹{fmt(amount)}
      </div>
    </div>
  )
}

// Percentage + computed amount input pair
function PctRow({ label, pct, onPctChange, amount, readOnly, disabled }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
      <div style={{ position:'relative' }}>
        <span style={{ position:'absolute', top:-9, left:10, background: disabled ? '#f9fafb' : '#fff', padding:'0 4px', fontSize:11, fontWeight:600, color:'#9ca3af', fontFamily:FONT, zIndex:1, letterSpacing:'.04em', textTransform:'uppercase' }}>{label} %</span>
        <input type="number" value={pct} onChange={onPctChange} min={0} max={100} step={0.01}
          readOnly={readOnly || disabled}
          style={{ ...inputBase, background: (readOnly||disabled) ? '#f9fafb' : '#fff', cursor: (readOnly||disabled) ? 'default' : 'text' }} />
      </div>
      <div style={{ position:'relative' }}>
        <span style={{ position:'absolute', top:-9, left:10, background:'#f9fafb', padding:'0 4px', fontSize:11, fontWeight:600, color:'#9ca3af', fontFamily:FONT, zIndex:1, letterSpacing:'.04em', textTransform:'uppercase' }}>Amount</span>
        <input readOnly value={amount > 0 ? fmt(amount) : '0'} style={{ ...inputBase, background:'#f9fafb', cursor:'default' }} />
      </div>
    </div>
  )
}

const tdS = { padding:'10px 12px', color:'#374151', borderRight:'1px solid #f3f4f6', whiteSpace:'nowrap', verticalAlign:'middle', fontSize:13 }
const card = { background:'#fff', borderRadius:12, padding:'24px', border:'1px solid #e8edf2', boxShadow:'0 1px 4px rgba(0,0,0,0.05)', marginBottom:20 }

// ── Payment Modal ─────────────────────────────────────────────────────────────
function PaymentModal({ proforma, onClose, onSuccess }) {
  const [form, setForm] = useState({
    payment_date:     new Date().toISOString().slice(0,10),
    amount:           '',
    mode:             'NEFT',
    reference_number: '',
  })
  const [saving, setSaving] = useState(false)
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))
  const remaining = Number(proforma?.total_receivable || 0)

  const handleSubmit = async () => {
    if (!form.amount || !form.payment_date) { alert('Amount and date are required'); return }
    if (Number(form.amount) <= 0)           { alert('Amount must be positive'); return }
    if (Number(form.amount) > remaining)    { alert(`Amount cannot exceed remaining receivable ₹${fmt(remaining)}`); return }
    setSaving(true)
    try {
      await api.post(`/proforma/${proforma.id}/add_payment/`, form)
      onSuccess()
      onClose()
    } catch (e) {
      alert(e.response?.data ? JSON.stringify(e.response.data, null, 2) : 'Something went wrong')
    } finally { setSaving(false) }
  }

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1100 }} />
      <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', background:'#fff', borderRadius:12, width:'90%', maxWidth:460, zIndex:1101, fontFamily:FONT, boxShadow:'0 24px 80px rgba(0,0,0,.22)' }}>
        <div style={{ padding:'16px 22px 13px', borderBottom:'1px solid #f0f0f0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontWeight:700, fontSize:15, color:PRIMARY }}>Record Payment</span>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#6b7280', display:'flex' }}><Icon d={ic.x} size={18} /></button>
        </div>
        <div style={{ padding:'20px 22px', display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div style={{ background:'#f0fdf4', borderRadius:8, padding:'12px 14px', fontSize:13, color:'#15803d' }}>
              <div style={{ fontSize:11, color:'#6b7280', marginBottom:3 }}>Invoice Total</div>
              <strong>₹{fmt(proforma?.total_amount)}</strong>
            </div>
            <div style={{ background:'#eff6ff', borderRadius:8, padding:'12px 14px', fontSize:13, color:'#1d4ed8' }}>
              <div style={{ fontSize:11, color:'#6b7280', marginBottom:3 }}>Remaining</div>
              <strong>₹{fmt(remaining)}</strong>
            </div>
          </div>
          <FInput label="Payment Date *" value={form.payment_date} onChange={set('payment_date')} type="date" />
          <FInput label="Amount *" value={form.amount} onChange={set('amount')} placeholder={`Max ₹${fmt(remaining)}`} type="number" />
          <div style={{ position:'relative' }}>
            <span style={{ position:'absolute', top:-9, left:10, background:'#fff', padding:'0 4px', fontSize:11, fontWeight:600, color:'#9ca3af', fontFamily:FONT, zIndex:1, letterSpacing:'.04em', textTransform:'uppercase' }}>Mode</span>
            <select value={form.mode} onChange={set('mode')}
              style={{ ...inputBase, appearance:'none', backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat:'no-repeat', backgroundPosition:'right 12px center', paddingRight:36 }}>
              {['NEFT','RTGS','IMPS','Cheque','DD','Cash','UPI'].map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <FInput label="Reference Number" value={form.reference_number} onChange={set('reference_number')} placeholder="UTR / Cheque No." />
        </div>

        {proforma?.payments?.length > 0 && (
          <div style={{ padding:'0 22px 16px' }}>
            <p style={{ margin:'0 0 10px', fontSize:13.5, fontWeight:700, color:PRIMARY }}>Payment History</p>
            <div style={{ borderRadius:8, border:'1px solid #e5e7eb', overflow:'hidden' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr style={{ background:'#f9fafb' }}>
                    {['Date','Amount','Mode','Ref'].map(h => (
                      <th key={h} style={{ padding:'8px 12px', textAlign:'left', fontWeight:600, color:'#374151', fontSize:12, borderBottom:'1px solid #e5e7eb' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {proforma.payments.map((p, i) => (
                    <tr key={i} style={{ borderBottom:'1px solid #f3f4f6' }}>
                      <td style={{ padding:'8px 12px', color:'#374151' }}>{p.payment_date}</td>
                      <td style={{ padding:'8px 12px', fontWeight:600, color:'#16a34a' }}>₹{fmt(p.amount)}</td>
                      <td style={{ padding:'8px 12px', color:'#374151' }}>{p.mode}</td>
                      <td style={{ padding:'8px 12px', color:'#6b7280', fontFamily:'monospace', fontSize:12 }}>{p.reference_number || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div style={{ padding:'12px 22px', borderTop:'1px solid #f0f0f0', display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'9px 20px', border:'1px solid #d1d5db', borderRadius:7, background:'#fff', fontSize:13, fontWeight:500, cursor:'pointer', color:'#374151', fontFamily:FONT }}>Cancel</button>
          <button onClick={handleSubmit} disabled={saving} style={{ padding:'9px 22px', border:'none', borderRadius:7, background:PRIMARY, fontSize:13, fontWeight:600, cursor:saving?'not-allowed':'pointer', color:'#fff', fontFamily:FONT, opacity:saving?.7:1 }}>
            {saving ? 'Saving…' : 'Record Payment'}
          </button>
        </div>
      </div>
    </>
  )
}

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════ */
export default function ProformaDetail({ basePath = '/employee/proforma-invoices' }) {
  const { id }   = useParams()
  const navigate = useNavigate()

  const [proforma,     setProforma]     = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [saving,       setSaving]       = useState(false)
  const [savingDeduct, setSavingDeduct] = useState(false)
  const [error,        setError]        = useState(null)
  const [showPayModal, setShowPayModal] = useState(false)

  // Editable deduction percentages (local state — saved to backend on "Save Deductions")
  const [ffPct,   setFfPct]   = useState('0')
  const [discPct, setDiscPct] = useState('0')
  const [advPct,  setAdvPct]  = useState('0')

  // Currency (editable while DRAFT)
  const [currency, setCurrency] = useState('INR')

  const load = () => {
    if (!id) { setError('No proforma ID provided.'); setLoading(false); return }
    setLoading(true)
    api.get(`/proforma/${id}/`)
      .then(r => {
        const data = r.data
        setProforma(data)
        setFfPct(String(data.ff_percentage   || '0'))
        setDiscPct(String(data.discount_percentage || '0'))
        setAdvPct(String(data.advance_percentage  || '0'))
        setCurrency(data.currency || 'INR')
      })
      .catch(err => { console.error(err); setError('Failed to load proforma invoice.') })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  const handleSend = async () => {
    setSaving(true)
    try {
      await api.post(`/proforma/${id}/send/`)
      load()
    } catch (e) {
      alert(e.response?.data ? JSON.stringify(e.response.data, null, 2) : 'Something went wrong')
    } finally { setSaving(false) }
  }

  const handleSaveDeductions = async () => {
    setSavingDeduct(true)
    try {
      await api.patch(`/proforma/${id}/update_deductions/`, {
        ff_percentage:       parseFloat(ffPct)   || 0,
        discount_percentage: parseFloat(discPct) || 0,
        advance_percentage:  parseFloat(advPct)  || 0,
      })
      load()  // reload to get server-recalculated amounts
    } catch (e) {
      alert(e.response?.data ? JSON.stringify(e.response.data, null, 2) : 'Something went wrong')
    } finally { setSavingDeduct(false) }
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:320, fontFamily:FONT }}>
      <div style={{ width:34, height:34, border:`3px solid #e5e7eb`, borderTopColor:PRIMARY, borderRadius:'50%', animation:'spin .8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (error) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:320, fontFamily:FONT, gap:12 }}>
      <div style={{ color:'#dc2626', fontSize:14, fontWeight:600 }}>{error}</div>
      <button onClick={() => navigate(basePath)} style={{ padding:'8px 20px', borderRadius:8, border:'1.5px solid #e2e8f0', background:'#fff', cursor:'pointer', fontSize:13, fontFamily:FONT }}>Go Back</button>
    </div>
  )

  // ── Derived ──────────────────────────────────────────────────────────────
  const lineItems    = proforma?.line_items     || []
  const payments     = proforma?.payments       || []
  const customerData = proforma?.customer_detail || null
  const primaryPOC   = customerData?.pocs?.find(p => p.is_primary) || customerData?.pocs?.[0] || null

  // Always compute from line items — source of truth for display
  const { subTotal, totalTax, grandTotal } = computeLineTotals(lineItems)

  // Local preview of deductions while user is editing (before saving)
  const { ffAmt, discAmt, advAmt, receivable: previewReceivable } =
    computeDeductions(grandTotal, ffPct, discPct, advPct)

  // Tax type for display
  const codes       = lineItems.map(i => i.tax_group_code || '')
  const hasIGST     = codes.some(t => t.startsWith('IGST'))
  const hasGST      = codes.some(t => t.startsWith('GST'))
  const taxType     = hasIGST && !hasGST ? 'IGST' : hasGST && !hasIGST ? 'CGST+SGST' : codes.length ? 'Mixed' : 'None'
  const firstTaxPct = Number(lineItems[0]?.tax_percent) || 0

  const totalPaid       = Number(proforma?.total_paid      || 0)
  // Use server value for receivable after payments; use preview locally while editing deductions
  const serverReceivable = Number(proforma?.total_receivable || grandTotal)

  const isPaid      = proforma?.status === 'PAID'
  const canEdit     = proforma?.status !== 'PAID'  // editable until PAID

  const statusColor = {
    DRAFT:    { color:'#f59e0b', bg:'#fffbeb' },
    SENT:     { color:'#1e88e5', bg:'#e2f1ff' },
    PARTIAL:  { color:'#7c3aed', bg:'#f3e8ff' },
    PAID:     { color:'#16a34a', bg:'#f0fdf4' },
    CANCELLED:{ color:'#6b7280', bg:'#f9fafb' },
  }[proforma?.status] || { color:'#6b7280', bg:'#f9fafb' }

  // Has the user changed percentages from what's saved?
  const deductionsChanged =
    parseFloat(ffPct)   !== Number(proforma?.ff_percentage   || 0) ||
    parseFloat(discPct) !== Number(proforma?.discount_percentage || 0) ||
    parseFloat(advPct)  !== Number(proforma?.advance_percentage  || 0)

  return (
    <div style={{ fontFamily:FONT, width:'100%', minHeight:'100vh', background:'#f8f9fb', padding:'0 0 48px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing:border-box; }
        @keyframes spin { to{transform:rotate(360deg)} }
        input:focus,select:focus { outline:none; border-color:${PRIMARY}!important; box-shadow:0 0 0 3px rgba(18,44,65,0.08)!important; }
        input,select { font-family:${FONT}!important; }
      `}</style>

      {showPayModal && (
        <PaymentModal proforma={proforma} onClose={() => setShowPayModal(false)} onSuccess={load} />
      )}

      {/* PAGE HEADER */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 28px', borderBottom:'1px solid #e8edf2', background:'#fff', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={() => navigate(-1)} style={{ width:34, height:34, borderRadius:8, border:'1.5px solid #e2e8f0', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Icon d={ic.arrowLeft} size={15} color="#64748b" />
          </button>
          <div>
            <h1 style={{ margin:0, fontSize:18, fontWeight:700, color:PRIMARY }}>Proforma Invoice</h1>
            {proforma && <span style={{ fontSize:12.5, color:'#9ca3af' }}>{proforma.proforma_number}</span>}
          </div>
          {proforma?.status && (
            <span style={{ padding:'3px 10px', borderRadius:99, fontSize:11.5, fontWeight:700, color:statusColor.color, background:statusColor.bg }}>
              {proforma.status}
            </span>
          )}
        </div>
        <div style={{ display:'flex', gap:10 }}>
          {proforma?.status === 'DRAFT' && (
            <button onClick={handleSend} disabled={saving}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 20px', borderRadius:9, border:'none', background:ACCENT, color:'#fff', fontSize:13.5, fontWeight:600, cursor:saving?'not-allowed':'pointer', fontFamily:FONT }}>
              <Icon d={ic.send} size={14} color="#fff" />
              {saving ? 'Sending…' : 'Send Invoice'}
            </button>
          )}
          {['SENT','PARTIAL'].includes(proforma?.status) && (
            <button onClick={() => setShowPayModal(true)}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 20px', borderRadius:9, border:'none', background:'#16a34a', color:'#fff', fontSize:13.5, fontWeight:600, cursor:'pointer', fontFamily:FONT }}>
              <Icon d={ic.dollar} size={14} color="#fff" /> Add Payment
            </button>
          )}
          <button onClick={() => window.print()} style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 18px', borderRadius:9, border:`1.5px solid ${PRIMARY}`, background:'#fff', color:PRIMARY, fontSize:13.5, fontWeight:600, cursor:'pointer', fontFamily:FONT }}>
            <Icon d={ic.print} size={14} color={PRIMARY} /> Print
          </button>
        </div>
      </div>

      <div style={{ padding:'20px 28px' }}>

        {/* ── SECTION 1: INVOICE INFO ── */}
        <div style={card}>
          <div style={{ marginBottom:20, paddingBottom:12, borderBottom:'1.5px solid #f1f5f9' }}>
            <h2 style={{ margin:0, fontSize:14, fontWeight:700, color:PRIMARY, textTransform:'uppercase', letterSpacing:'0.04em' }}>Invoice Information</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:16 }}>
            <FInput label="Proforma Number" value={proforma?.proforma_number || ''} onChange={() => {}} readOnly />
            <FInput label="Order Number"    value={proforma?.order_number    || ''} onChange={() => {}} readOnly />
            <FInput label="OA Number"       value={proforma?.oa_number       || ''} onChange={() => {}} readOnly />
            <FInput label="Invoice Date"    value={proforma?.invoice_date    || ''} onChange={() => {}} readOnly />
          </div>
        </div>

        {/* ── SECTION 2: CUSTOMER DETAILS ── */}
        {customerData && (
          <div style={card}>
            <div style={{ marginBottom:20, paddingBottom:12, borderBottom:'1.5px solid #f1f5f9' }}>
              <h2 style={{ margin:0, fontSize:14, fontWeight:700, color:PRIMARY, textTransform:'uppercase', letterSpacing:'0.04em' }}>Customer Details</h2>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
              <div style={{ border:'1px solid #e8edf2', borderRadius:8, padding:16, borderTop:`2px solid ${PRIMARY}22` }}>
                <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:12 }}>
                  <Icon d={ic.building} size={13} color="#6b7280" />
                  <span style={{ fontSize:12.5, fontWeight:700, color:PRIMARY, textTransform:'uppercase', letterSpacing:'0.04em' }}>Customer</span>
                </div>
                {[['Company',customerData.company_name],['Region',customerData.region],['State',customerData.state],['City',customerData.city],['Country',customerData.country]].map(([l,v]) => (
                  <div key={l} style={{ display:'flex', padding:'5px 0', borderBottom:'1px solid #f4f6f9' }}>
                    <span style={{ minWidth:70, color:'#7a8899', fontSize:12, fontWeight:500 }}>{l} :</span>
                    <span style={{ color:'#1a2332', fontSize:12, fontWeight:500 }}>{v || '—'}</span>
                  </div>
                ))}
              </div>
              <div style={{ border:'1px solid #e8edf2', borderRadius:8, padding:16, borderTop:`2px solid ${PRIMARY}22` }}>
                <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:12 }}>
                  <Icon d={ic.user} size={13} color="#6b7280" />
                  <span style={{ fontSize:12.5, fontWeight:700, color:PRIMARY, textTransform:'uppercase', letterSpacing:'0.04em' }}>Contact (POC)</span>
                </div>
                {primaryPOC
                  ? [['Name',primaryPOC.name],['Email',primaryPOC.email],['Phone',primaryPOC.phone]].map(([l,v]) => (
                      <div key={l} style={{ padding:'5px 0', borderBottom:'1px solid #f4f6f9', display:'flex' }}>
                        <span style={{ minWidth:55, color:'#7a8899', fontSize:12, fontWeight:500 }}>{l} :</span>
                        <span style={{ fontSize:12, color:'#1a2332', fontWeight:500 }}>{v || '—'}</span>
                      </div>
                    ))
                  : <span style={{ color:'#9ca3af', fontSize:12 }}>No POC on record</span>}
              </div>
              <div style={{ border:'1px solid #e8edf2', borderRadius:8, padding:16, borderTop:`2px solid ${PRIMARY}22` }}>
                <div style={{ fontSize:12.5, fontWeight:700, color:PRIMARY, textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:12 }}>Invoice Value</div>
                <div style={{ fontSize:26, fontWeight:700, color:PRIMARY, marginBottom:4 }}>₹{fmt(grandTotal)}</div>
                <div style={{ fontSize:12, color:'#94a3b8', fontStyle:'italic', lineHeight:1.5 }}>{numToWords(grandTotal)}</div>
                {totalPaid > 0 && (
                  <div style={{ marginTop:10, padding:'8px 10px', background:'#f0fdf4', borderRadius:6, fontSize:12.5, color:'#16a34a', fontWeight:600 }}>
                    Paid ₹{fmt(totalPaid)} · Remaining ₹{fmt(serverReceivable)}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── SECTION 3: LINE ITEMS ── */}
        <div style={card}>
          <div style={{ marginBottom:20, paddingBottom:12, borderBottom:'1.5px solid #f1f5f9' }}>
            <h2 style={{ margin:0, fontSize:14, fontWeight:700, color:PRIMARY, textTransform:'uppercase', letterSpacing:'0.04em' }}>Line Items</h2>
            <p style={{ margin:'5px 0 0', fontSize:12.5, color:'#6b7280' }}>Copied from the Order at creation time. Read-only.</p>
          </div>
          <div style={{ overflowX:'auto', borderRadius:10, border:'1px solid #e2e8f0' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:1000, fontSize:13 }}>
              <thead>
                <tr style={{ background:PRIMARY }}>
                  {['Job Code','Cust. Part No','Part No.','Description','HSN','Qty','Unit','Unit Price','Tax %','Tax Amt','Total (incl. tax)'].map(c => (
                    <th key={c} style={{ padding:'11px 12px', color:'#e2e8f0', fontWeight:600, textAlign:'left', whiteSpace:'nowrap', fontSize:11.5, borderRight:'1px solid rgba(255,255,255,.07)', textTransform:'uppercase', letterSpacing:'0.04em' }}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lineItems.length === 0 ? (
                  <tr><td colSpan={11} style={{ padding:28, textAlign:'center', color:'#9ca3af', fontSize:13 }}>No line items.</td></tr>
                ) : lineItems.map((item, i) => {
                  const qty      = Number(item.quantity)    || 0
                  const price    = Number(item.unit_price)  || 0
                  const taxPct   = Number(item.tax_percent) || 0
                  const excl     = qty * price
                  const lineTax  = excl * (taxPct / 100)
                  return (
                    <tr key={i} style={{ background:i%2===0?'#fafafa':'#fff', borderBottom:'1px solid #f3f4f6' }}>
                      <td style={tdS}>{item.job_code         || '—'}</td>
                      <td style={tdS}>{item.customer_part_no || '—'}</td>
                      <td style={tdS}>{item.part_no          || '—'}</td>
                      <td style={{ ...tdS, maxWidth:180, whiteSpace:'normal' }}>{item.description || '—'}</td>
                      <td style={tdS}>{item.hsn_code         || '—'}</td>
                      <td style={tdS}>{qty}</td>
                      <td style={tdS}>{item.unit             || 'NOS'}</td>
                      <td style={tdS}>₹{fmt(price)}</td>
                      <td style={tdS}>{item.tax_group_code   || (taxPct ? `${taxPct}%` : '—')}</td>
                      <td style={tdS}>₹{fmt(lineTax)}</td>
                      <td style={{ ...tdS, fontWeight:600, color:PRIMARY }}>₹{fmt(excl + lineTax)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── SECTION 4: AMOUNT DETAIL ── */}
        <div style={card}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, paddingBottom:12, borderBottom:'1.5px solid #f1f5f9' }}>
            <h2 style={{ margin:0, fontSize:14, fontWeight:700, color:PRIMARY, textTransform:'uppercase', letterSpacing:'0.04em' }}>Amount Detail</h2>
            {canEdit && deductionsChanged && (
              <button onClick={handleSaveDeductions} disabled={savingDeduct}
                style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 18px', borderRadius:8, border:'none', background:PRIMARY, color:'#fff', fontSize:13, fontWeight:600, cursor:savingDeduct?'not-allowed':'pointer', fontFamily:FONT, opacity:savingDeduct?.7:1 }}>
                <Icon d={ic.save} size={13} color="#fff" />
                {savingDeduct ? 'Saving…' : 'Save Deductions'}
              </button>
            )}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:32 }}>

            {/* LEFT: Percentage inputs */}
            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
              <FSelect label="Currency" value={currency} onChange={e => setCurrency(e.target.value)}>
                {['INR','USD','EUR','GBP','AED'].map(c => <option key={c}>{c}</option>)}
              </FSelect>

              <PctRow
                label="F & F Amount"
                pct={ffPct}
                onPctChange={e => setFfPct(e.target.value)}
                amount={ffAmt}
                readOnly={!canEdit}
              />
              <PctRow
                label="Discount"
                pct={discPct}
                onPctChange={e => setDiscPct(e.target.value)}
                amount={discAmt}
                readOnly={!canEdit}
              />
              <PctRow
                label="Advance Received"
                pct={advPct}
                onPctChange={e => setAdvPct(e.target.value)}
                amount={advAmt}
                readOnly={!canEdit}
              />

              {canEdit && deductionsChanged && (
                <div style={{ padding:'10px 14px', background:'#fffbeb', border:'1px solid #fde68a', borderRadius:8, fontSize:12.5, color:'#92400e' }}>
                  ⚠ Percentages changed. Click "Save Deductions" to apply.
                </div>
              )}
            </div>

            {/* RIGHT: Totals summary */}
            <div style={{ background:'#f8fafc', borderRadius:10, padding:'20px 24px', border:'1px solid #e8edf2' }}>
              <AmountRow label="Sub Total (excl. tax)"  amount={subTotal} />

              {taxType === 'IGST' && (
                <AmountRow label={`IGST ${firstTaxPct}%`} amount={totalTax} />
              )}
              {taxType === 'CGST+SGST' && (
                <>
                  <AmountRow label={`CGST ${firstTaxPct/2}%`} amount={totalTax/2} />
                  <AmountRow label={`SGST ${firstTaxPct/2}%`} amount={totalTax/2} />
                </>
              )}
              {taxType === 'Mixed' && (
                <AmountRow label="Total Tax" amount={totalTax} />
              )}

              <AmountRow label="Total Amount (incl. tax)" amount={grandTotal} />

              {ffAmt > 0 && (
                <AmountRow label={`F & F (${ffPct}%)`} amount={-ffAmt} sub="Deduction" />
              )}
              {discAmt > 0 && (
                <AmountRow label={`Discount (${discPct}%)`} amount={-discAmt} sub="Deduction" />
              )}
              {advAmt > 0 && (
                <AmountRow label={`Advance (${advPct}%)`} amount={-advAmt} sub="Deduction" />
              )}

              <div style={{ marginTop:4 }}>
                <AmountRow label="Total Receivable" amount={previewReceivable} highlight />
              </div>

              <div style={{ marginTop:10, padding:'10px 0', fontSize:12.5, color:'#6b7280', fontStyle:'italic', borderTop:'1px solid #e8edf2' }}>
                {numToWords(previewReceivable)}
              </div>

              {totalPaid > 0 && (
                <div style={{ marginTop:12, padding:'10px 14px', background:'#f0fdf4', borderRadius:8, fontSize:13, color:'#15803d', display:'flex', justifyContent:'space-between' }}>
                  <span>Total Paid</span>
                  <strong>₹{fmt(totalPaid)}</strong>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── SECTION 5: PAYMENT HISTORY ── */}
        {payments.length > 0 && (
          <div style={card}>
            <div style={{ marginBottom:20, paddingBottom:12, borderBottom:'1.5px solid #f1f5f9' }}>
              <h2 style={{ margin:0, fontSize:14, fontWeight:700, color:PRIMARY, textTransform:'uppercase', letterSpacing:'0.04em' }}>Payment History</h2>
            </div>
            <div style={{ overflowX:'auto', borderRadius:9, border:'1px solid #e5e7eb' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr style={{ background:'#f9fafb' }}>
                    {['#','Date','Amount','Mode','Reference','Running Balance'].map(h => (
                      <th key={h} style={{ padding:'9px 14px', textAlign:'left', fontWeight:600, color:'#374151', fontSize:12.5, borderBottom:'1px solid #e5e7eb' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payments.reduce((acc, p, i) => {
                    const prev    = i > 0 ? acc[i-1].balance : serverReceivable
                    acc.push({ ...p, balance: prev - Number(p.amount) })
                    return acc
                  }, []).map((p, i) => (
                    <tr key={i} style={{ borderBottom:'1px solid #f3f4f6' }}>
                      <td style={{ padding:'9px 14px', color:'#9ca3af', fontSize:12 }}>{i+1}</td>
                      <td style={{ padding:'9px 14px', color:'#374151' }}>{p.payment_date}</td>
                      <td style={{ padding:'9px 14px', fontWeight:600, color:'#16a34a' }}>₹{fmt(p.amount)}</td>
                      <td style={{ padding:'9px 14px', color:'#374151' }}>{p.mode}</td>
                      <td style={{ padding:'9px 14px', color:'#6b7280', fontFamily:'monospace', fontSize:12 }}>{p.reference_number || '—'}</td>
                      <td style={{ padding:'9px 14px', fontWeight:600, color: p.balance <= 0 ? '#16a34a' : '#374151' }}>₹{fmt(Math.max(p.balance, 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop:14, display:'flex', justifyContent:'flex-end', gap:32, fontSize:14, paddingTop:10, borderTop:'1.5px solid #f3f4f6' }}>
              <span style={{ color:'#374151' }}>Total Paid: <strong style={{ color:'#16a34a' }}>₹{fmt(totalPaid)}</strong></span>
              <span style={{ color:'#374151' }}>Remaining: <strong style={{ color: serverReceivable <= 0 ? '#16a34a' : PRIMARY }}>₹{fmt(serverReceivable)}</strong></span>
            </div>
          </div>
        )}

        {isPaid && (
          <div style={{ padding:'16px 20px', background:'#f0fdf4', borderRadius:10, border:'1px solid #bbf7d0', display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
            <Icon d={ic.check} size={16} color="#16a34a" />
            <span style={{ fontSize:13.5, color:'#15803d', fontWeight:600 }}>This invoice has been fully paid.</span>
          </div>
        )}

      </div>
    </div>
  )
}