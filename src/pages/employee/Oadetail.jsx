import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../api/axios'
import AddProductsModal from '../../components/modals/AddProductsModal'
import { printOADetail } from '../../components/PrintOADetail'

const PRIMARY = '#122C41'
const ACCENT  = '#1e88e5'
const FONT    = "'Inter', 'Segoe UI', sans-serif"

const Icon = ({ d, size = 16, color = 'currentColor', fill = 'none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

const ic = {
  arrowLeft: 'M19 12H5M12 19l-7-7 7-7',
  print:     'M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z',
  check:     'M20 6L9 17l-5-5',
  plus:      'M12 5v14M5 12h14',
  x:         'M18 6L6 18M6 6l12 12',
  user:      'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  arrow:     'M5 12h14M12 5l7 7-7 7',
  building:  'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10',
  tag:       'M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z',
  pencil:    'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z',
}

const fmt = n => new Intl.NumberFormat('en-IN').format(n ?? 0)

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

// ── Compute totals directly from items array — no stale closure risk ──────────
function computeTotals(items) {
  let subTotal = 0
  let totalTax = 0
  const enriched = items.map(item => {
    const qty      = Number(item.quantity)   || 0
    const price    = Number(item.unit_price) || 0
    const taxPct   = Number(item.tax_percent) || 0
    const lineExcl = qty * price
    const lineTax  = lineExcl * (taxPct / 100)
    subTotal  += lineExcl
    totalTax  += lineTax
    return { ...item, tax_amount: lineTax, total: lineExcl + lineTax }
  })
  return { enriched, subTotal, totalTax, grandTotal: subTotal + totalTax }
}

function getTaxSummary(items, totalTax) {
  if (!items.length) return { type: 'None', igst: 0, cgst: 0, sgst: 0, taxPercent: 0, halfTaxPercent: 0 }
  const firstTaxPct = Number(items[0]?.tax_percent) || 0
  const codes = items.map(i => i.tax_group_code || '')
  const hasIGST = codes.some(t => t.startsWith('IGST'))
  const hasGST  = codes.some(t => t.startsWith('GST'))
  if (hasIGST && !hasGST)
    return { type: 'IGST',      igst: totalTax,    cgst: 0,           sgst: 0,           taxPercent: firstTaxPct, halfTaxPercent: 0 }
  if (hasGST && !hasIGST)
    return { type: 'CGST+SGST', igst: 0,           cgst: totalTax/2,  sgst: totalTax/2,  taxPercent: firstTaxPct, halfTaxPercent: firstTaxPct/2 }
  return   { type: 'Mixed/IGST', igst: totalTax,   cgst: 0,           sgst: 0,           taxPercent: firstTaxPct, halfTaxPercent: 0 }
}

// ── Styled input components ───────────────────────────────────────────────────
const inputBase = {
  width:'100%', padding:'9px 13px', border:'1px solid #dde3ea',
  borderRadius:7, fontSize:13, fontFamily:FONT, color:'#1a2332',
  background:'#fff', transition:'border .15s, box-shadow .15s', boxSizing:'border-box'
}
const selBase = {
  ...inputBase, appearance:'none',
  backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat:'no-repeat', backgroundPosition:'right 12px center', paddingRight:36,
}

function FInput({ label, value, onChange, placeholder, type='text', readOnly=false }) {
  return (
    <div style={{ position:'relative' }}>
      {label && <span style={{ position:'absolute', top:-8, left:10, background:readOnly?'#f9fafb':'#fff', padding:'0 4px', fontSize:10.5, fontWeight:600, color:'#7a8899', fontFamily:FONT, zIndex:1, whiteSpace:'nowrap', letterSpacing:'0.03em' }}>{label}</span>}
      <input type={type} value={value??''} onChange={onChange} placeholder={placeholder} readOnly={readOnly}
        style={{ ...inputBase, background:readOnly?'#f8f9fb':'#fff', cursor:readOnly?'default':'text', color:readOnly?'#64748b':'#1a2332' }} />
    </div>
  )
}
function FSelect({ label, value, onChange, children }) {
  return (
    <div style={{ position:'relative' }}>
      {label && <span style={{ position:'absolute', top:-8, left:10, background:'#fff', padding:'0 4px', fontSize:10.5, fontWeight:600, color:'#7a8899', fontFamily:FONT, zIndex:1, whiteSpace:'nowrap', letterSpacing:'0.03em' }}>{label}</span>}
      <select value={value??''} onChange={onChange} style={selBase}>{children}</select>
    </div>
  )
}
function FTextarea({ label, value, onChange, placeholder, rows=3 }) {
  return (
    <div style={{ position:'relative' }}>
      {label && <span style={{ position:'absolute', top:-8, left:10, background:'#fff', padding:'0 4px', fontSize:10.5, fontWeight:600, color:'#7a8899', fontFamily:FONT, zIndex:1, letterSpacing:'0.03em' }}>{label}</span>}
      <textarea value={value??''} onChange={onChange} placeholder={placeholder} rows={rows}
        style={{ ...inputBase, resize:'vertical', height:'auto' }} />
    </div>
  )
}
function Checkbox({ checked, onChange, label }) {
  return (
    <label style={{ display:'flex', alignItems:'center', gap:7, cursor:'pointer', userSelect:'none' }}>
      <div onClick={onChange} style={{ width:18, height:18, borderRadius:4, border:`2px solid ${checked?ACCENT:'#d1d5db'}`, background:checked?ACCENT:'#fff', display:'flex', alignItems:'center', justifyContent:'center', transition:'all .15s', flexShrink:0 }}>
        {checked && <Icon d={ic.check} size={10} color="#fff" />}
      </div>
      {label && <span style={{ fontSize:13.5, color:'#374151', fontWeight:500 }}>{label}</span>}
    </label>
  )
}
function SectionTitle({ title, action }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18, paddingBottom:10, borderBottom:'1.5px solid #f1f5f9' }}>
      <h2 style={{ margin:0, fontSize:14, fontWeight:700, color:PRIMARY, textTransform:'uppercase', letterSpacing:'0.04em' }}>{title}</h2>
      {action}
    </div>
  )
}
function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{ display:'flex', gap:0, borderBottom:'1.5px solid #e8edf2', marginBottom:20, flexWrap:'wrap' }}>
      {tabs.map(t => (
        <button key={t} onClick={() => onChange(t)} style={{ padding:'9px 16px', fontFamily:FONT, fontSize:12.5, fontWeight:600, border:'none', background:'none', cursor:'pointer', color:active===t?PRIMARY:'#94a3b8', borderBottom:`2px solid ${active===t?PRIMARY:'transparent'}`, marginBottom:-2, transition:'all .15s', whiteSpace:'nowrap', letterSpacing:'0.01em' }}>
          {t}
        </button>
      ))}
    </div>
  )
}

function AddressCard({ title, icon, borderColor, data, onChange, sameCheck, onSameChange, sameLabel, entityOptions, onEntitySelect }) {
  return (
    <div style={{ border:`1px solid ${borderColor}`, borderRadius:10, padding:18, flex:1, background:'#fff', minWidth:260, borderTop:`3px solid ${borderColor}` }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span>{icon}</span>
          <span style={{ fontSize:13.5, fontWeight:700, color:PRIMARY }}>{title}</span>
        </div>
        {sameCheck !== undefined && <Checkbox checked={sameCheck} onChange={onSameChange} label={sameLabel} />}
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:13 }}>
        <div style={{ position:'relative' }}>
          <span style={{ position:'absolute', top:-9, left:10, background:'#fff', padding:'0 4px', fontSize:11, fontWeight:600, color:'#9ca3af', fontFamily:FONT, zIndex:1, letterSpacing:'.04em', textTransform:'uppercase' }}>Entity Name</span>
          <select value={data.entity_name??''} onChange={e => {
            const sel = entityOptions?.find(o => o.entity_name === e.target.value)
            if (sel && onEntitySelect) onEntitySelect(sel)
            else onChange('entity_name', e.target.value)
          }} style={selBase}>
            <option value="">Select Entity</option>
            {(entityOptions||[]).map(o => <option key={o.id||o.entity_name} value={o.entity_name}>{o.entity_name}</option>)}
          </select>
        </div>
        <FTextarea label="Address"        value={data.address_line}   onChange={e => onChange('address_line',   e.target.value)} rows={3} />
        <FInput    label="Contact Person" value={data.contact_person} onChange={e => onChange('contact_person', e.target.value)} />
        <FInput    label="E-mail ID"      value={data.contact_email}  onChange={e => onChange('contact_email',  e.target.value)} type="email" />
        <FInput    label="Contact Number" value={data.contact_number} onChange={e => onChange('contact_number', e.target.value)} />
      </div>
    </div>
  )
}

const tdS = { padding:'10px 12px', color:'#374151', borderRight:'1px solid #f3f4f6', whiteSpace:'nowrap', verticalAlign:'middle', fontSize:13 }

function LineItemsTable({ items, onRemove, onEdit }) {
  const cols = ['Job Code','Cust. Part No','Part No.','Name / Description','HSN Code','Qty','Unit','Unit Price','Tax %','Tax Amt','Total (incl. tax)']
  return (
    <div style={{ overflowX:'auto', borderRadius:10, border:'1px solid #e2e8f0', boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', minWidth:1100, fontSize:13 }}>
        <thead>
          <tr style={{ background:PRIMARY }}>
            {cols.map(c => <th key={c} style={{ padding:'12px 14px', color:'#e2e8f0', fontWeight:600, textAlign:'left', whiteSpace:'nowrap', fontSize:11.5, borderRight:'1px solid rgba(255,255,255,.07)', textTransform:'uppercase', letterSpacing:'0.04em' }}>{c}</th>)}
            <th style={{ padding:'12px 14px', color:'#e2e8f0', fontWeight:600, fontSize:11.5, textTransform:'uppercase', letterSpacing:'0.04em' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && (
            <tr><td colSpan={12} style={{ padding:28, textAlign:'center', color:'#9ca3af', fontSize:13 }}>No line items. Click "+ Add Products" to add.</td></tr>
          )}
          {items.map((item, i) => {
            // Compute per-row values directly — no stale state
            const qty      = Number(item.quantity)    || 0
            const price    = Number(item.unit_price)  || 0
            const taxPct   = Number(item.tax_percent) || 0
            const lineExcl = qty * price
            const lineTax  = lineExcl * (taxPct / 100)
            const lineTotal = lineExcl + lineTax
            return (
              <tr key={i} style={{ background:i%2===0?'#fafafa':'#fff', borderBottom:'1px solid #f3f4f6' }}>
                <td style={tdS}>{item.job_code||'—'}</td>
                <td style={tdS}>{item.customer_part_no||'—'}</td>
                <td style={tdS}>{item.part_no||'—'}</td>
                <td style={{ ...tdS, maxWidth:160, whiteSpace:'normal' }}>{item.product_name_snapshot||item.description||'—'}</td>
                <td style={tdS}>{item.hsn_code||'—'}</td>
                <td style={tdS}>{qty}</td>
                <td style={tdS}>{item.unit||'NOS'}</td>
                <td style={tdS}>₹{fmt(price)}</td>
                <td style={tdS}>{item.tax_group_code || (taxPct ? `${taxPct}%` : '—')}</td>
                <td style={tdS}>₹{fmt(lineTax)}</td>
                <td style={{ ...tdS, fontWeight:600, color:PRIMARY }}>₹{fmt(lineTotal)}</td>
                <td style={{ padding:'6px 8px', textAlign:'center', whiteSpace:'nowrap' }}>
                  <button onClick={() => onEdit(i)} style={{ width:26, height:26, borderRadius:6, border:'none', background:'#e0f2fe', cursor:'pointer', display:'inline-flex', alignItems:'center', justifyContent:'center', marginRight:4 }}>
                    <Icon d={ic.pencil} size={12} color="#0284c7" />
                  </button>
                  <button onClick={() => onRemove(i)} style={{ width:26, height:26, borderRadius:6, border:'none', background:'#fee2e2', cursor:'pointer', display:'inline-flex', alignItems:'center', justifyContent:'center' }}>
                    <Icon d={ic.x} size={12} color="#dc2626" />
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

const COMMERCIAL_TABS = ['Commercial Terms', 'Terms + Conditions', 'Factory Details', 'Channel Partner', 'Order Cancellation', 'Short Supply']

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════ */
export default function OADetail({ basePath = '/employee/order-acknowledgements' }) {
  const { id }   = useParams()
  const navigate = useNavigate()

  const [oa,      setOa]      = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState(null)

  const [orderDetails, setOrderDetails] = useState({
    order_number:'', order_type:'std.mfg.comp', order_date:'', quote_date:'',
    order_book_number:'', customer_po_number:'NA', po_date:'', delivery_date:'',
    division:'LQP', project_type:'',
  })
  const [transport, setTransport] = useState({
    mode_of_transport:'By Road', preferred_transporter:'Will be intimated later',
    packing_type:'Card Board', ecc_exemption:'Not Applicable',
    road_permit:'Not Required', shipping_gst:'Not Required',
    loi_number:'NA', project_name:'NA',
  })

  const [billing,       setBilling]       = useState({ entity_name:'', address_line:'', contact_person:'', contact_email:'', contact_number:'' })
  const [shipping,      setShipping]      = useState({ entity_name:'', address_line:'', contact_person:'', contact_email:'', contact_number:'' })
  const [sameAsBilling, setSame]          = useState(false)
  const [billingEntities,  setBillingEntities]  = useState([])
  const [shippingEntities, setShippingEntities] = useState([])

  const [lineItems, setLineItems] = useState([])

  const [showProductModal, setShowProductModal] = useState(false)

  const [commTab,  setCommTab]  = useState('Commercial Terms')
  const [commTerms, setCommTerms] = useState({
    currency:'INR', warranty_details:'Under Warranty',
    payment_terms:'100% Advance', days_after_invoicing:'0', advance_percentage:'100',
    price_basis:'Ex. Works', insurance:'Customer', inspection:'Post - Dispatch',
    ld_clause:'Not Applicable', test_certificate:'Required',
    warranty:'12 months from date of supply against',
    drawing_approval:'No', freight_charges:'To be paid by Customer',
    abg_format:'Not Applicable', pbg_format:'Required',
    sd_format:'12 months from date of supply against',
    schedule_dispatch_date:'', dispatch_clearance:'Required',
    commissioning_support:'12 months from date of supply against',
    order_processing_name:'', order_processing_email:'', order_processing_phone:'',
    regional_manager_name:'', regional_manager_email:'', regional_manager_phone:'',
    project_exec_name:'', project_exec_email:'', project_exec_phone:'',
    customer_support_1_name:'', customer_support_1_email:'', customer_support_1_phone:'',
    customer_support_2_name:'', customer_support_2_email:'', customer_support_2_phone:'',
    channel_partner:'ZS Associates', commission:'0.00', commission_amount:'0',
    consultant_name:'ZS Associates', consultant_charges:'0',
    order_cancellation:'No', order_cancelled_by:'', cancellation_reason:'NA',
    brief_description:'NA', remark:'NA',
  })
  const [shortSupplyItems, setShortSupplyItems] = useState([])

  // ── Compute totals inline on every render — no useCallback/stale closure ──
  const { enriched: enrichedItems, subTotal: totalOrderValue, totalTax, grandTotal } = computeTotals(lineItems)
  const taxSummary = getTaxSummary(lineItems, totalTax)

  // ── Populate address entity dropdown options ───────────────────────────────
  const populateEntityOptions = (customerData) => {
    if (!customerData?.addresses) return
    const bill = customerData.addresses.filter(a => a.address_type === 'BILLING')
    const ship = customerData.addresses.filter(a => a.address_type === 'SHIPPING')
    setBillingEntities(bill.length  ? bill  : customerData.addresses)
    setShippingEntities(ship.length ? ship  : customerData.addresses)
  }

  // ── Load OA from API ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) { setError('No OA ID provided.'); setLoading(false); return }
    setLoading(true)
    api.get(`/orders/oa/${id}/`)
      .then(r => {
        const data = r.data
        setOa(data)

        const tr = data.transport_details || {}
        setTransport(p => ({
          ...p,
          mode_of_transport:    tr.mode_of_transport    || p.mode_of_transport,
          preferred_transporter:tr.preferred_transporter|| p.preferred_transporter,
          packing_type:         tr.packing_type         || p.packing_type,
          ecc_exemption:        tr.ecc_exemption        || p.ecc_exemption,
          road_permit:          tr.road_permit          || p.road_permit,
          shipping_gst:         tr.shipping_gst         || p.shipping_gst,
          loi_number:           tr.loi_number           || p.loi_number,
          project_name:         tr.project_name         || p.project_name,
        }))

        setOrderDetails({
          order_number:       data.oa_number || tr.order_number || '',
          order_type:         tr.order_type         || 'std.mfg.comp',
          order_date:         tr.order_date         || '',
          quote_date:         tr.quote_date         || '',
          order_book_number:  data.oa_number || tr.order_book_number || '',
          customer_po_number: tr.customer_po_number || 'NA',
          po_date:            tr.po_date            || '',
          delivery_date:      tr.delivery_date      || '',
          division:           tr.division           || 'LQP',
          project_type:       tr.project_type       || '',
        })

        setBilling(data.billing_snapshot   || {})
        setShipping(data.shipping_snapshot || {})

        // Map line items — normalise field names from API
        const items = (data.line_items || []).map(li => ({
          id:                   li.id,
          job_code:             li.job_code             || '',
          customer_part_no:     li.customer_part_no     || '',
          part_no:              li.part_no              || '',
          product_name_snapshot:li.product_name_snapshot|| li.description || '',
          description:          li.description          || '',
          hsn_code:             li.hsn_code             || '',
          quantity:             li.quantity             || 0,
          unit:                 li.unit                 || 'NOS',
          unit_price:           li.unit_price           || 0,
          tax_group_code:       li.tax_group_code       || 'GST 18%',
          tax_percent:          Number(li.tax_percent)  || 0,
          tax_amount:           Number(li.tax_amount)   || 0,
          total:                Number(li.total)        || 0,
        }))
        setLineItems(items)

        if (data.commercial_terms) {
          setCommTerms(p => ({ ...p, ...data.commercial_terms }))
        }

        // Populate address dropdowns from customer data
        if (data.customer_detail) {
          populateEntityOptions(data.customer_detail)
        }
      })
      .catch(err => {
        console.error(err)
        setError('Failed to load OA. Please go back and try again.')
      })
      .finally(() => setLoading(false))
  }, [id])

  // ── Address helpers ───────────────────────────────────────────────────────
  const updateBilling = (k, v) => {
    setBilling(p => ({ ...p, [k]: v }))
    if (sameAsBilling) setShipping(p => ({ ...p, [k]: v }))
  }
  const handleSame = (checked) => {
    setSame(checked)
    if (checked) setShipping({ ...billing })
  }
  const addrToForm = a => ({
    entity_name:    a.entity_name    || '',
    address_line:   a.address_line   || '',
    contact_person: a.contact_person || '',
    contact_email:  a.contact_email  || '',
    contact_number: a.contact_number || '',
  })
  const handleBillingEntitySelect  = a => { const f = addrToForm(a); setBilling(f); if (sameAsBilling) setShipping(f) }
  const handleShippingEntitySelect = a => setShipping(addrToForm(a))

  // ── Line item helpers ─────────────────────────────────────────────────────
  const removeLineItem = i => setLineItems(p => p.filter((_, idx) => idx !== i))
  const openEditItem   = i => {
    // Not supported via modal index — open modal with all items
    setShowProductModal(true)
  }

  // ── Build payload for PATCH ───────────────────────────────────────────────
  const buildPayload = (status) => ({
    status,
    billing_snapshot:  billing,
    shipping_snapshot: sameAsBilling ? billing : shipping,
    transport_details: { ...transport, ...orderDetails },
    line_items: enrichedItems.map(li => ({
      job_code:         li.job_code         || '',
      customer_part_no: li.customer_part_no || '',
      part_no:          li.part_no          || '',
      description:      li.product_name_snapshot || li.description || '',
      hsn_code:         li.hsn_code         || '',
      quantity:         parseFloat(li.quantity)    || 0,
      unit:             li.unit             || 'NOS',
      unit_price:       parseFloat(li.unit_price)  || 0,
      tax_group_code:   li.tax_group_code   || '',
      tax_percent:      parseFloat(li.tax_percent) || 0,
      tax_amount:       parseFloat(li.tax_amount)  || 0,
      total:            parseFloat(li.total)        || 0,
    })),
    commercial_terms: {
      payment_terms:         commTerms.payment_terms,
      advance_percentage:    parseFloat(commTerms.advance_percentage)  || 0,
      days_after_invoicing:  parseInt(commTerms.days_after_invoicing)  || 0,
      price_basis:           commTerms.price_basis,
      insurance:             commTerms.insurance,
      inspection:            commTerms.inspection,
      ld_clause:             commTerms.ld_clause,
      test_certificate:      commTerms.test_certificate,
      warranty:              commTerms.warranty,
      drawing_approval:      commTerms.drawing_approval,
      freight_charges:       commTerms.freight_charges,
      abg_format:            commTerms.abg_format,
      pbg_format:            commTerms.pbg_format,
      sd_format:             commTerms.sd_format,
      dispatch_clearance:    commTerms.dispatch_clearance,
      commissioning_support: commTerms.commissioning_support,
      schedule_dispatch_date:commTerms.schedule_dispatch_date || null,
      net_amount:            totalOrderValue,
      igst:                  taxSummary.type.includes('IGST') ? totalTax : 0,
      cgst:                  taxSummary.type.includes('CGST') ? totalTax / 2 : 0,
      sgst:                  taxSummary.type.includes('SGST') ? totalTax / 2 : 0,
      total_amount:          grandTotal,
      channel_partner_name:  commTerms.channel_partner,
      consultant_name:       commTerms.consultant_name,
      commission_percentage: parseFloat(commTerms.commission)          || 0,
      commission_amount:     parseFloat(commTerms.commission_amount)   || 0,
      consultant_charges:    parseFloat(commTerms.consultant_charges)  || 0,
    },
  })

  const handleSaveDraft = async () => {
    setSaving(true)
    try {
      await api.patch(`/orders/oa/${id}/`, buildPayload('DRAFT'))
      navigate(basePath)
    } catch (e) {
      console.error(e)
      alert(e.response?.data ? JSON.stringify(e.response.data, null, 2) : 'Something went wrong')
    } finally { setSaving(false) }
  }

  const handleShareOA = async () => {
    setSaving(true)
    try {
      // Save latest data first, then share
      await api.patch(`/orders/oa/${id}/`, buildPayload('DRAFT'))
      await api.post(`/orders/oa/${id}/share/`)
      navigate(basePath)
    } catch (e) {
      console.error(e)
      alert(e.response?.data ? JSON.stringify(e.response.data, null, 2) : 'Something went wrong')
    } finally { setSaving(false) }
  }

  // ── Derived values ────────────────────────────────────────────────────────
  const customerData = oa?.customer_detail || null
  const primaryPOC   = customerData?.pocs?.find(p => p.is_primary) || customerData?.pocs?.[0] || null
  const quotNum      = oa?.quotation_number || ''
  const oaNum        = oa?.oa_number        || ''
  const oaStatus     = oa?.status           || ''

  // ── Loading / error states ────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:320, fontFamily:FONT, background:'#f8f9fb' }}>
      <div style={{ width:34, height:34, border:`3px solid #e5e7eb`, borderTopColor:PRIMARY, borderRadius:'50%', animation:'spin .8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (error) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:320, fontFamily:FONT, flexDirection:'column', gap:12 }}>
      <div style={{ color:'#dc2626', fontSize:14, fontWeight:600 }}>{error}</div>
      <button onClick={() => navigate(basePath)} style={{ padding:'8px 20px', borderRadius:8, border:'1.5px solid #e2e8f0', background:'#fff', cursor:'pointer', fontSize:13, fontFamily:FONT }}>
        Go Back
      </button>
    </div>
  )

  const isConverted = oaStatus === 'CONVERTED'

  return (
    <div style={{ fontFamily:FONT, width:'100%', minHeight:'100vh', background:'#f8f9fb', padding:'0 0 48px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing:border-box; }
        @keyframes spin { to{transform:rotate(360deg)} }
        input:focus,select:focus,textarea:focus { outline:none; border-color:${PRIMARY}!important; box-shadow:0 0 0 3px rgba(18,44,65,0.08)!important; }
        input,select,textarea { font-family:${FONT}!important; }
      `}</style>

      {showProductModal && (
        <AddProductsModal
          open={showProductModal}
          onClose={() => setShowProductModal(false)}
          initialItems={lineItems}
          onSave={items => { setLineItems(items); setShowProductModal(false) }}
          currency={commTerms?.currency || 'INR'}
        />
      )}

      {/* PAGE HEADER */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 28px', borderBottom:'1px solid #e8edf2', background:'#fff', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={() => navigate(-1)} style={{ width:34, height:34, borderRadius:8, border:'1.5px solid #e2e8f0', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Icon d={ic.arrowLeft} size={15} color="#64748b" />
          </button>
          <h1 style={{ margin:0, fontSize:18, fontWeight:700, color:PRIMARY, letterSpacing:'-0.2px' }}>Order Acknowledgment</h1>
          {oaStatus && (
            <span style={{
              padding:'3px 10px', borderRadius:99, fontSize:11.5, fontWeight:700,
              color: oaStatus==='CONVERTED'?'#1e88e5': oaStatus==='DRAFT'?'#f59e0b':'#16a34a',
              background: oaStatus==='CONVERTED'?'#e2f1ff': oaStatus==='DRAFT'?'#fffbeb':'#f0fdf4',
            }}>
              {oaStatus==='CONVERTED'?'Sent': oaStatus==='DRAFT'?'Draft':'Pending'}
            </span>
          )}
        </div>
        <button 
          onClick={() => printOADetail(oa)} 
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 18px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', color: PRIMARY, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}
        >
          <Icon d={ic.print} size={14} color={PRIMARY} /> Print OA
        </button>
      </div>

      <div style={{ padding:'20px 28px' }}>

        {/* ── SECTION 1: OA INFO ── */}
        <div style={card}>
          <SectionTitle title="Order Acknowledgment Info" />
          <div style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
            <div style={{ flex:1, minWidth:220 }}>
              <FInput label="Quotation Number" value={quotNum} onChange={() => {}} readOnly />
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:4, color:'#9ca3af' }}>
              <div style={{ width:80, borderTop:'2px dashed #d1d5db' }} />
              <Icon d={ic.arrow} size={16} color="#9ca3af" />
            </div>
            <div style={{ flex:1, minWidth:220 }}>
              <FInput label="OA Number" value={oaNum} onChange={() => {}} readOnly />
            </div>
          </div>
        </div>

        {/* ── SECTION 2: CUSTOMER DETAILS ── */}
        {customerData && (
          <div style={card}>
            <SectionTitle title="Customer Details" />
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, alignItems:'start' }}>
              {/* Company info */}
              <div style={{ border:'1px solid #e8edf2', borderRadius:8, padding:16, background:'#fff', borderTop:`2px solid ${PRIMARY}22` }}>
                <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:12 }}>
                  <Icon d={ic.building} size={13} color="#6b7280" />
                  <span style={{ fontSize:12.5, fontWeight:700, color:PRIMARY, textTransform:'uppercase', letterSpacing:'0.04em' }}>Customer Details</span>
                </div>
                {[
                  ['Entity Name', customerData.company_name],
                  ['Region',      customerData.region],
                  ['Country',     customerData.country],
                  ['State',       customerData.state],
                  ['City',        customerData.city],
                ].map(([label, val]) => (
                  <div key={label} style={{ display:'flex', padding:'6px 0', borderBottom:'1px solid #f4f6f9' }}>
                    <span style={{ minWidth:96, color:'#7a8899', fontSize:12, fontWeight:500 }}>{label} :</span>
                    <span style={{ color:'#1a2332', fontSize:12, fontWeight:500 }}>{val || '—'}</span>
                  </div>
                ))}
              </div>
              {/* POC */}
              <div style={{ border:'1px solid #e8edf2', borderRadius:8, padding:16, background:'#fff', borderTop:`2px solid ${PRIMARY}22` }}>
                <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:12 }}>
                  <Icon d={ic.user} size={13} color="#6b7280" />
                  <span style={{ fontSize:12.5, fontWeight:700, color:PRIMARY, textTransform:'uppercase', letterSpacing:'0.04em' }}>Contact Detail (POC)</span>
                </div>
                {primaryPOC
                  ? [['Name', primaryPOC.name],['Email', primaryPOC.email],['Phone', primaryPOC.phone]].map(([l,v]) => (
                      <div key={l} style={{ padding:'6px 0', borderBottom:'1px solid #f4f6f9', display:'flex' }}>
                        <span style={{ minWidth:60, color:'#7a8899', fontSize:12, fontWeight:500 }}>{l} :</span>
                        <span style={{ fontSize:12, color:'#1a2332', fontWeight:500 }}>{v || '—'}</span>
                      </div>
                    ))
                  : <span style={{ color:'#9ca3af', fontSize:12 }}>No POC on record</span>}
              </div>
              {/* OA Value */}
              <div style={{ border:'1px solid #e8edf2', borderRadius:8, padding:16, background:'#fff', borderTop:`2px solid ${PRIMARY}22` }}>
                <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:12 }}>
                  <Icon d={ic.tag} size={13} color="#6b7280" />
                  <span style={{ fontSize:12.5, fontWeight:700, color:PRIMARY, textTransform:'uppercase', letterSpacing:'0.04em' }}>Order Acknowledgment Value</span>
                </div>
                <div style={{ fontSize:24, fontWeight:700, color:PRIMARY, marginBottom:6, letterSpacing:'-0.5px' }}>₹{fmt(grandTotal || oa?.total_value)}</div>
                <div style={{ fontSize:12, color:'#94a3b8', fontStyle:'italic', lineHeight:1.6 }}>{numToWords(grandTotal || oa?.total_value)}</div>
              </div>
            </div>
          </div>
        )}

        {/* ── SECTION 3: ORDER DETAILS ── */}
        <div style={card}>
          <SectionTitle title="Order Details" />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
            <FInput   label="Order Number"      value={orderDetails.order_number}      onChange={() => {}} readOnly />
            <FSelect  label="Order Type"        value={orderDetails.order_type}        onChange={e=>setOrderDetails(p=>({...p,order_type:e.target.value}))}>
              {['std.mfg.comp','service','trading','project'].map(o=><option key={o}>{o}</option>)}
            </FSelect>
            <FInput   label="Order Date"        value={orderDetails.order_date}        onChange={e=>setOrderDetails(p=>({...p,order_date:e.target.value}))}        type="date" />
            <FInput   label="Quote Date"        value={orderDetails.quote_date}        onChange={e=>setOrderDetails(p=>({...p,quote_date:e.target.value}))}        type="date" />
            <FInput   label="Order Book Number" value={orderDetails.order_book_number} onChange={e=>setOrderDetails(p=>({...p,order_book_number:e.target.value}))} />
            <FSelect  label="Customer PO Number" value={orderDetails.customer_po_number} onChange={e=>setOrderDetails(p=>({...p,customer_po_number:e.target.value}))}>
              <option>NA</option><option>Customer PO</option>
            </FSelect>
            <FInput   label="PO Date"       value={orderDetails.po_date}       onChange={e=>setOrderDetails(p=>({...p,po_date:e.target.value}))}       type="date" />
            <FInput   label="Delivery Date" value={orderDetails.delivery_date} onChange={e=>setOrderDetails(p=>({...p,delivery_date:e.target.value}))} type="date" />
            <FSelect  label="Division"      value={orderDetails.division}      onChange={e=>setOrderDetails(p=>({...p,division:e.target.value}))}>
              {['LQP','Engineering','Manufacturing','Services'].map(o=><option key={o}>{o}</option>)}
            </FSelect>
            <div style={{ gridColumn:'2/-1' }}>
              <FSelect label="Project Type" value={orderDetails.project_type} onChange={e=>setOrderDetails(p=>({...p,project_type:e.target.value}))}>
                <option value="">Select Project Type</option>
                <option>Sample Cooler / VREL / TSV / BRVP / Cation Value</option>
                <option>Standard Equipment</option><option>Custom Project</option><option>Service Contract</option>
              </FSelect>
            </div>
          </div>
        </div>

        {/* ── SECTION 4: TRANSPORTATION ── */}
        <div style={card}>
          <SectionTitle title="Transportation Detail" />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
            <FSelect label="Mode of Transport"     value={transport.mode_of_transport}     onChange={e=>setTransport(p=>({...p,mode_of_transport:e.target.value}))}>
              {['By Road','By Air','By Sea','By Rail'].map(o=><option key={o}>{o}</option>)}
            </FSelect>
            <FSelect label="Preferred Transporter" value={transport.preferred_transporter} onChange={e=>setTransport(p=>({...p,preferred_transporter:e.target.value}))}>
              <option>Will be intimated later</option><option>DHL</option><option>FedEx</option><option>DTDC</option><option>Blue Dart</option>
            </FSelect>
            <FSelect label="Packing Type"          value={transport.packing_type}          onChange={e=>setTransport(p=>({...p,packing_type:e.target.value}))}>
              {['Card Board','Wooden Crate','Bubble Wrap','Foam','Custom'].map(o=><option key={o}>{o}</option>)}
            </FSelect>
            <FSelect label="ECC Exemption Letter"  value={transport.ecc_exemption}         onChange={e=>setTransport(p=>({...p,ecc_exemption:e.target.value}))}>
              {['Not Applicable','Required','Provided'].map(o=><option key={o}>{o}</option>)}
            </FSelect>
            <FSelect label="Road Permit"           value={transport.road_permit}           onChange={e=>setTransport(p=>({...p,road_permit:e.target.value}))}>
              {['Not Required','Required','Arranged by Customer'].map(o=><option key={o}>{o}</option>)}
            </FSelect>
            <FSelect label="Shipping GST Number"   value={transport.shipping_gst}          onChange={e=>setTransport(p=>({...p,shipping_gst:e.target.value}))}>
              {['Not Required','Required'].map(o=><option key={o}>{o}</option>)}
            </FSelect>
            <FInput  label="LOI Number"   value={transport.loi_number}  onChange={e=>setTransport(p=>({...p,loi_number:e.target.value}))} />
            <FInput  label="Project Name" value={transport.project_name} onChange={e=>setTransport(p=>({...p,project_name:e.target.value}))} />
          </div>
        </div>

        {/* ── SECTION 5: BILLING & SHIPPING ── */}
        <div style={card}>
          <SectionTitle title="Billing & Shipping Details" />
          <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
            <AddressCard title="Bill To :" icon={<Icon d={ic.building} size={14} color="#6b7280" />} borderColor="#c7d9f5"
              data={billing} onChange={updateBilling}
              entityOptions={billingEntities} onEntitySelect={handleBillingEntitySelect} />
            <AddressCard title="Ship To :" icon={<Icon d={ic.arrow} size={14} color="#6b7280" />} borderColor="#f5c7a0"
              data={shipping} onChange={(k,v) => { setSame(false); setShipping(p=>({...p,[k]:v})) }}
              sameCheck={sameAsBilling} onSameChange={() => handleSame(!sameAsBilling)} sameLabel="Same as billing address"
              entityOptions={shippingEntities} onEntitySelect={handleShippingEntitySelect} />
          </div>
        </div>

        {/* ── SECTION 6: LINE ITEMS ── */}
        <div style={card}>
          <SectionTitle title="Order Details (Line Items)"
            action={
              !isConverted && (
                <button onClick={() => setShowProductModal(true)}
                  style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 18px', borderRadius:8, border:'1.5px solid #e2e8f0', background:'#fff', color:PRIMARY, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:FONT, boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
                  <Icon d={ic.plus} size={13} color={PRIMARY} /> Add Products
                </button>
              )
            }
          />
          <LineItemsTable items={lineItems} onRemove={removeLineItem} onEdit={openEditItem} />

          {lineItems.length > 0 && (
            <div style={{ marginTop:16, borderTop:'2px solid #f3f4f6', paddingTop:14 }}>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6 }}>
                <div style={{ display:'flex', gap:48, fontSize:13.5, color:'#374151' }}>
                  <span>Sub Total (excl. tax)</span>
                  <span style={{ fontWeight:600, minWidth:130, textAlign:'right' }}>₹{fmt(totalOrderValue)}</span>
                </div>
                <div style={{ display:'flex', gap:48, fontSize:13.5, color:'#374151' }}>
                  <span>Total Tax</span>
                  <span style={{ fontWeight:600, minWidth:130, textAlign:'right' }}>₹{fmt(totalTax)}</span>
                </div>
                <div style={{ display:'flex', gap:48, fontSize:15, fontWeight:700, color:PRIMARY, borderTop:'1.5px solid #e5e7eb', paddingTop:8, marginTop:2 }}>
                  <span>Total Order Value (incl. tax)</span>
                  <span style={{ minWidth:130, textAlign:'right' }}>₹{fmt(grandTotal)}</span>
                </div>
                <div style={{ fontSize:12.5, color:'#6b7280', fontStyle:'italic' }}>
                  Rupees {numToWords(grandTotal)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── SECTION 7: COMMERCIAL TERMS ── */}
        <div style={card}>
          <SectionTitle title="Commercial Terms" />
          <Tabs tabs={COMMERCIAL_TABS} active={commTab} onChange={setCommTab} />

          {commTab === 'Commercial Terms' && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                <FSelect label="Currency" value={commTerms.currency} onChange={e=>setCommTerms(p=>({...p,currency:e.target.value}))}>
                  {['INR','USD','EUR','GBP','AED'].map(c=><option key={c}>{c}</option>)}
                </FSelect>
                <FSelect label="Warranty Details" value={commTerms.warranty_details} onChange={e=>setCommTerms(p=>({...p,warranty_details:e.target.value}))}>
                  {['Under Warranty','Out of Warranty','AMC'].map(o=><option key={o}>{o}</option>)}
                </FSelect>
              </div>

              <FInput label="Net Amount (excl. tax)" value={fmt(totalOrderValue)} onChange={() => {}} readOnly />

              {/* Tax Summary */}
              <div style={{ padding:'12px', background:'#f8fafc', borderRadius:8, border:'1px solid #e2e8f0' }}>
                <div style={{ marginBottom:12, fontWeight:600, color:PRIMARY, fontSize:13 }}>
                  Tax Summary (auto-calculated from line items)
                </div>
                {lineItems.length > 0 ? (
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {[
                      { label:`IGST ${taxSummary.taxPercent}%`,          amount: taxSummary.igst,  active: taxSummary.type.includes('IGST') },
                      { label:`CGST ${taxSummary.halfTaxPercent}%`,      amount: taxSummary.cgst,  active: taxSummary.type.includes('CGST') },
                      { label:`SGST ${taxSummary.halfTaxPercent}%`,      amount: taxSummary.sgst,  active: taxSummary.type.includes('SGST') },
                    ].map(row => (
                      <div key={row.label} style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 12px', background:'#fff', borderRadius:6 }}>
                        <div style={{ width:18, height:18, borderRadius:4, background:row.active?ACCENT:'#e2e8f0', display:'flex', alignItems:'center', justifyContent:'center' }}>
                          {row.active && <Icon d={ic.check} size={10} color="#fff" />}
                        </div>
                        <span style={{ flex:1, fontWeight:500, fontSize:13 }}>{row.label}</span>
                        <span style={{ fontWeight:600, fontSize:13 }}>₹{fmt(row.amount)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color:'#94a3b8', textAlign:'center', padding:16, fontSize:13 }}>Add line items to see tax summary</div>
                )}
              </div>

              <FInput label="Total (Net + Tax)" value={fmt(grandTotal)} onChange={() => {}} readOnly />
              <FInput label="Brief Description" value={commTerms.brief_description} onChange={e=>setCommTerms(p=>({...p,brief_description:e.target.value}))} />
              <FInput label="Remark / Special Instruction" value={commTerms.remark} onChange={e=>setCommTerms(p=>({...p,remark:e.target.value}))} />
            </div>
          )}

          {commTab === 'Terms + Conditions' && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
              <FSelect label="Pay Terms" value={commTerms.payment_terms} onChange={e=>setCommTerms(p=>({...p,payment_terms:e.target.value}))}>
                {['100% Advance','50% Advance 50% on delivery','30 days credit','60 days credit','Against LC'].map(o=><option key={o}>{o}</option>)}
              </FSelect>
              <FInput label="No. of Days after Invoicing" value={commTerms.days_after_invoicing} onChange={e=>setCommTerms(p=>({...p,days_after_invoicing:e.target.value}))} type="number" />
              <FInput label="% Advance (% PI)"            value={commTerms.advance_percentage}    onChange={e=>setCommTerms(p=>({...p,advance_percentage:e.target.value}))}    type="number" />
              <FSelect label="Price Basis"  value={commTerms.price_basis}  onChange={e=>setCommTerms(p=>({...p,price_basis:e.target.value}))}>
                {['Ex. Works','FOR Destination','CIF','FOB'].map(o=><option key={o}>{o}</option>)}
              </FSelect>
              <FSelect label="Insurance"    value={commTerms.insurance}    onChange={e=>setCommTerms(p=>({...p,insurance:e.target.value}))}>
                {['Customer','Supplier','Third Party'].map(o=><option key={o}>{o}</option>)}
              </FSelect>
              <FSelect label="Inspection"   value={commTerms.inspection}   onChange={e=>setCommTerms(p=>({...p,inspection:e.target.value}))}>
                {['Post - Dispatch','Pre - Dispatch','Third Party'].map(o=><option key={o}>{o}</option>)}
              </FSelect>
              <FSelect label="LD Clause"    value={commTerms.ld_clause}    onChange={e=>setCommTerms(p=>({...p,ld_clause:e.target.value}))}>
                {['Not Applicable','0.5% per week','1% per week'].map(o=><option key={o}>{o}</option>)}
              </FSelect>
              <FSelect label="Test Certificate" value={commTerms.test_certificate} onChange={e=>setCommTerms(p=>({...p,test_certificate:e.target.value}))}>
                {['Required','Not Required'].map(o=><option key={o}>{o}</option>)}
              </FSelect>
              <FSelect label="Warranty"     value={commTerms.warranty}     onChange={e=>setCommTerms(p=>({...p,warranty:e.target.value}))}>
                {['12 months from date of supply against','18 months from date of supply','24 months from date of supply'].map(o=><option key={o}>{o}</option>)}
              </FSelect>
              <FSelect label="Drawing Approval" value={commTerms.drawing_approval} onChange={e=>setCommTerms(p=>({...p,drawing_approval:e.target.value}))}>
                {['No','Yes - Before Manufacturing'].map(o=><option key={o}>{o}</option>)}
              </FSelect>
              <FSelect label="Freight Charges"  value={commTerms.freight_charges}  onChange={e=>setCommTerms(p=>({...p,freight_charges:e.target.value}))}>
                {['To be paid by Customer','Included in price','Extra at actual'].map(o=><option key={o}>{o}</option>)}
              </FSelect>
              <div />
              <FSelect label="ABG Format"   value={commTerms.abg_format}   onChange={e=>setCommTerms(p=>({...p,abg_format:e.target.value}))}>
                {['Not Applicable','Required'].map(o=><option key={o}>{o}</option>)}
              </FSelect>
              <FSelect label="PBG Format"   value={commTerms.pbg_format}   onChange={e=>setCommTerms(p=>({...p,pbg_format:e.target.value}))}>
                {['Required','Not Required'].map(o=><option key={o}>{o}</option>)}
              </FSelect>
              <FSelect label="SD Format"    value={commTerms.sd_format}    onChange={e=>setCommTerms(p=>({...p,sd_format:e.target.value}))}>
                {['12 months from date of supply against','Not Applicable'].map(o=><option key={o}>{o}</option>)}
              </FSelect>
              <FInput  label="Schedule Dispatch Date" value={commTerms.schedule_dispatch_date} onChange={e=>setCommTerms(p=>({...p,schedule_dispatch_date:e.target.value}))} type="date" />
              <FSelect label="Dispatch Clearance"     value={commTerms.dispatch_clearance}     onChange={e=>setCommTerms(p=>({...p,dispatch_clearance:e.target.value}))}>
                {['Required','Not Required'].map(o=><option key={o}>{o}</option>)}
              </FSelect>
              <FSelect label="Commissioning Support"  value={commTerms.commissioning_support}  onChange={e=>setCommTerms(p=>({...p,commissioning_support:e.target.value}))}>
                {['12 months from date of supply against','Not Required'].map(o=><option key={o}>{o}</option>)}
              </FSelect>
            </div>
          )}

          {commTab === 'Factory Details' && (
            <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
              {[
                ['Order Processing','order_processing'],
                ['Regional Manager','regional_manager'],
                ['Project Exec/ Dist','project_exec'],
                ['Customer Support (1)','customer_support_1'],
                ['Customer Support (2)','customer_support_2'],
              ].map(([label, key]) => (
                <div key={key}>
                  <p style={{ margin:'0 0 10px', fontSize:13.5, fontWeight:600, color:'#374151' }}>{label} :</p>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
                    <FInput label="Name"     value={commTerms[`${key}_name`]}  onChange={e=>setCommTerms(p=>({...p,[`${key}_name`]:e.target.value}))} />
                    <FInput label="Email ID" value={commTerms[`${key}_email`]} onChange={e=>setCommTerms(p=>({...p,[`${key}_email`]:e.target.value}))} type="email" />
                    <FInput label="Phone"    value={commTerms[`${key}_phone`]} onChange={e=>setCommTerms(p=>({...p,[`${key}_phone`]:e.target.value}))} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {commTab === 'Channel Partner' && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>
              <FSelect label="Channel Partner" value={commTerms.channel_partner} onChange={e=>setCommTerms(p=>({...p,channel_partner:e.target.value}))}>
                <option>ZS Associates</option><option>None</option>
              </FSelect>
              <FInput label="Commission (%)"  value={commTerms.commission}        onChange={e=>setCommTerms(p=>({...p,commission:e.target.value}))}        placeholder="0.00" />
              <FInput label="Amount"          value={commTerms.commission_amount} onChange={e=>setCommTerms(p=>({...p,commission_amount:e.target.value}))} placeholder="0" />
              <FSelect label="Consultant Name" value={commTerms.consultant_name}  onChange={e=>setCommTerms(p=>({...p,consultant_name:e.target.value}))}>
                <option>ZS Associates</option><option>None</option>
              </FSelect>
              <FInput label="Charges" value={commTerms.consultant_charges} onChange={e=>setCommTerms(p=>({...p,consultant_charges:e.target.value}))} placeholder="0" />
            </div>
          )}

          {commTab === 'Order Cancellation' && (
            <div style={{ display:'flex', flexDirection:'column', gap:16, maxWidth:500 }}>
              <FSelect label="Order Cancellation" value={commTerms.order_cancellation} onChange={e=>setCommTerms(p=>({...p,order_cancellation:e.target.value}))}>
                {['No','Yes'].map(o=><option key={o}>{o}</option>)}
              </FSelect>
              {commTerms.order_cancellation === 'Yes' && (
                <>
                  <FSelect label="Order Canceled By" value={commTerms.order_cancelled_by} onChange={e=>setCommTerms(p=>({...p,order_cancelled_by:e.target.value}))}>
                    <option>Customer</option><option>Management</option><option>Other</option>
                  </FSelect>
                  <FTextarea label="Order Cancellation Reason (Mandatory)" value={commTerms.cancellation_reason} onChange={e=>setCommTerms(p=>({...p,cancellation_reason:e.target.value}))} rows={3} />
                </>
              )}
            </div>
          )}

          {commTab === 'Short Supply' && (
            <div>
              <p style={{ margin:'0 0 12px', fontSize:13, color:'#6b7280' }}>Items dispatched short / partially — select from order line items below.</p>
              <LineItemsTable
                items={shortSupplyItems.length > 0 ? shortSupplyItems : lineItems}
                onEdit={() => {}}
                onRemove={i => setShortSupplyItems(p => {
                  const copy = p.length > 0 ? [...p] : lineItems.map(l => ({...l}))
                  return copy.filter((_, idx) => idx !== i)
                })}
              />
            </div>
          )}
        </div>

        {/* BOTTOM ACTIONS — hidden for converted OAs */}
        {!isConverted && (
          <div style={{ display:'flex', justifyContent:'flex-end', gap:12, padding:'12px 0 48px' }}>
            <button onClick={handleSaveDraft} disabled={saving}
              style={{ padding:'11px 28px', borderRadius:9, border:'1.5px solid #e2e8f0', background:'#fff', color:'#374151', fontSize:13.5, fontWeight:600, cursor:saving?'not-allowed':'pointer', fontFamily:FONT, opacity:saving?.7:1, boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
              {saving ? 'Saving…' : 'Save as Draft'}
            </button>
            <button onClick={handleShareOA} disabled={saving}
              style={{ padding:'11px 32px', borderRadius:9, border:'none', background:saving?`${PRIMARY}88`:PRIMARY, color:'#fff', fontSize:13.5, fontWeight:700, cursor:saving?'not-allowed':'pointer', fontFamily:FONT, boxShadow:`0 4px 14px ${PRIMARY}40` }}>
              {saving ? 'Processing…' : 'Share OA'}
            </button>
          </div>
        )}

        {isConverted && (
          <div style={{ padding:'16px 20px', background:'#e2f1ff', borderRadius:10, border:'1px solid #bfdbfe', display:'flex', alignItems:'center', gap:10, marginBottom:48 }}>
            <Icon d={ic.check} size={16} color="#1e88e5" />
            <span style={{ fontSize:13.5, color:'#1e40af', fontWeight:600 }}>This OA has been shared and converted to an Order. It is now read-only.</span>
          </div>
        )}

      </div>
    </div>
  )
}

const card = { background:'#fff', borderRadius:10, padding:'20px 24px', border:'1px solid #e8edf2', boxShadow:'0 1px 3px rgba(0,0,0,0.04)', marginBottom:16 }