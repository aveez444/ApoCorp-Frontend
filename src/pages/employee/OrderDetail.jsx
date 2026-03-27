import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../api/axios'

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
  building:  'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10',
  user:      'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  truck:     'M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM18.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  mapPin:    'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  doc:       'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
  package:   'M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12',
  delivery:  'M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3M9 21H6a2 2 0 0 1-2-2v-1M16 8h4l3 3v5h-7V8zM18.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM7.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  coins:     'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM12 17v-2M12 7v2M9.5 9.5a2.5 2.5 0 0 1 5 0c0 1.5-1 2-2.5 3',
  terms:     'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M9 12h6M9 16h4',
}

const fmtMoney = n => (n != null && n !== '' && !isNaN(n)) ? `\u20B9${Number(n).toLocaleString('en-IN')}` : '\u2014'
const fmtDate  = d => d ? new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'2-digit', year:'numeric' }) : '\u2014'
const val      = v => (v != null && String(v).trim() !== '') ? String(v) : '\u2014'

// ── Stage pipeline matching Figma ──
const STAGES = [
  { key: 'PLANNING',    label: 'Hand over to\nplanning team' },
  { key: 'ENGINEERING', label: 'Engineering' },
  { key: 'PRODUCTION',  label: 'WIP\nProduction' },
  { key: 'ASSEMBLY',    label: 'Assembly' },
  { key: 'QA',          label: 'Inspection (QA)' },
  { key: 'FINAL_DOC',   label: 'Final\nDocumentation' },
  { key: 'LOGISTICS',   label: 'Logistics\nTeam' },
  { key: 'DISPATCH',    label: 'Dispatch' },
]
const STAGE_IDX = Object.fromEntries(STAGES.map((s, i) => [s.key, i]))

// Commercial terms tabs
const COMMERCIAL_TABS = ['Commercial Terms', 'Terms + Conditions', 'Factory Details', 'Channel Partner', 'Order Cancellation', 'Short Supply']

function StageProgress({ currentStage }) {

  const stageMap = {
    PLANNING:'PLANNING',
    ENGINEERING:'ENGINEERING',
    PRODUCTION:'PRODUCTION',
    QA:'QA',
    DISPATCH:'DISPATCH'
  }

  const mapped = stageMap[currentStage] ?? 'PRODUCTION'
  const currentIdx = STAGE_IDX[mapped] ?? 2

  const stageDates = [
    '1 Sep - 2 Sep',
    '3 Sep - 5 Sep',
    '6 Sep - 10 Sep',
    '11 Sep - 14 Sep',
    '15 Sep - 19 Sep',
    '20 Sep - 22 Sep',
    '24 Sep - 27 Sep',
    '28 Sep - 30 Sep'
  ]

  return (
    <div style={{ overflowX:'auto', paddingBottom:6 }}>

      {/* PIPELINE */}
      <div style={{
        display:'flex',
        minWidth:1000,
        alignItems:'stretch',
        marginBottom:2
      }}>

        {STAGES.map((stage, idx) => {

          const isDone = idx < currentIdx
          const isCurrent = idx === currentIdx

          const notch = 22

          const clip = idx === 0
            ? `polygon(0 0, calc(100% - ${notch}px) 0, 100% 50%, calc(100% - ${notch}px) 100%, 0 100%)`
            : idx === STAGES.length - 1
            ? `polygon(${notch}px 0,100% 0,100% 100%,${notch}px 100%,0 50%)`
            : `polygon(${notch}px 0,calc(100% - ${notch}px) 0,100% 50%,calc(100% - ${notch}px) 100%,${notch}px 100%,0 50%)`

          const background =
            isCurrent
              ? 'linear-gradient(90deg,#000000 0%, #0f2e47 35%, #1e88e5 100%)'
              : isDone
              ? '#f3f6fa'
              : '#ffffff'

          const border =
            isCurrent
              ? 'none'
              : isDone
              ? '1px solid #e2e8f0'
              : '1px solid #1e88e5'

          const statusColor =
            isCurrent ? '#93c5fd'
            : isDone ? '#22c55e'
            : '#f59e0b'

          const textColor =
            isCurrent ? '#ffffff'
            : '#374151'

          const statusText =
            isDone ? 'Done'
            : isCurrent ? 'WIP'
            : 'Pending'

          return (
            <div
              key={stage.key}
              style={{
                flex:1,
                minHeight:90,
                background,
                clipPath:clip,
                border,
                marginLeft: idx === 0 ? 0 : -notch + 2,
                zIndex:STAGES.length - idx,
                display:'flex',
                flexDirection:'column',
                justifyContent:'center',
                alignItems:'center',
                padding:'14px 8px',
                boxShadow: isCurrent
                  ? 'inset 0 0 0 1px rgba(255,255,255,0.08)'
                  : 'none'
              }}
            >

              {/* STATUS */}
              <div style={{
                display:'flex',
                alignItems:'center',
                gap:5,
                marginBottom:6
              }}>

                <span style={{
                  width:8,
                  height:8,
                  borderRadius:'50%',
                  background:statusColor
                }}/>

                <span style={{
                  fontSize:10,
                  fontWeight:700,
                  letterSpacing:'0.05em',
                  color:statusColor
                }}>
                  {statusText}
                </span>

              </div>

              {/* LABEL */}
              <div style={{
                fontSize:isCurrent ? 13 : 12,
                fontWeight:isCurrent ? 700 : 600,
                color:textColor,
                textAlign:'center',
                lineHeight:1.35,
                whiteSpace:'pre-line'
              }}>
                {stage.label}
              </div>

            </div>
          )
        })}

      </div>

      {/* DATES */}
      <div style={{ display:'flex', minWidth:1000 }}>

        {STAGES.map((stage, idx) => {

          const isDone = idx < currentIdx
          const isCurrent = idx === currentIdx

          const color =
            isDone ? '#22c55e'
            : isCurrent ? '#1e88e5'
            : '#9ca3af'

          const notch = 22

          return (
            <div
              key={stage.key}
              style={{
                flex:1,
                paddingLeft: idx === 0 ? 0 : notch - 2,
                textAlign:'center'
              }}
            >

              <div style={{
                display:'flex',
                alignItems:'center',
                justifyContent:'center',
                gap:6
              }}>

                <span style={{
                  width:10,
                  height:10,
                  borderRadius:'50%',
                  border:`2px solid ${color}`,
                  display:'inline-block'
                }}/>

                <span style={{
                  fontSize:11,
                  fontWeight:600,
                  color
                }}>
                  {stageDates[idx]}
                </span>

              </div>

            </div>
          )
        })}

      </div>

    </div>
  )
}

function InfoRow({ label, value, bold = false }) {
  return (
    <div style={{ display:'flex', gap:8, alignItems:'flex-start', padding:'5px 0', borderBottom:'1px solid #f3f4f6' }}>
      <span style={{ fontSize:13, color:'#6b7280', fontWeight:500, minWidth:170, flexShrink:0 }}>{label} :</span>
      <span style={{ fontSize:13.5, color:'#111827', fontWeight:bold ? 700 : 500, flex:1, wordBreak:'break-word' }}>{val(value)}</span>
    </div>
  )
}

function CompactInfoRow({ label, value }) {
  return (
    <div style={{ display:'flex', gap:4, padding:'4px 0' }}>
      <span style={{ fontSize:12.5, color:'#6b7280', fontWeight:500, minWidth:140 }}>{label} :</span>
      <span style={{ fontSize:12.5, color:'#111827', fontWeight:500 }}>{val(value)}</span>
    </div>
  )
}

function TermRow({ label, value }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
      <span style={{ fontSize:11, color:'#9ca3af', fontWeight:600, textTransform:'uppercase', letterSpacing:'.03em' }}>{label}</span>
      <span style={{ fontSize:13, color:'#111827', fontWeight:500 }}>{val(value)}</span>
    </div>
  )
}

function Card({ children, style={}, noPadding=false }) {
  return <div style={{ background:'#fff', borderRadius:10, padding: noPadding ? 0 : '18px 20px', border:'1px solid #e8edf2', boxShadow:'0 1px 3px rgba(0,0,0,0.04)', ...style }}>{children}</div>
}

function SectionHead({ icon, title, action }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, paddingBottom:10, borderBottom:'1px solid #f0f4f8' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <Icon d={icon} size={15} color={PRIMARY} />
        <span style={{ fontSize:14, fontWeight:700, color:PRIMARY }}>{title}</span>
      </div>
      {action}
    </div>
  )
}

function FlatSectionHead({ title, action }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, paddingBottom:10, borderBottom:'1.5px solid #f0f4f8' }}>
      <h2 style={{ margin:0, fontSize:14, fontWeight:700, color:PRIMARY, textTransform:'uppercase', letterSpacing:'0.04em' }}>{title}</h2>
      {action}
    </div>
  )
}

// Flat label : bold-value row (read-only display, matching Figma)
function FlatRow({ label, value }) {
  return (
    <div style={{ display:'flex', alignItems:'baseline', gap:0, padding:'5px 0', borderBottom:'1px solid #f4f6f9' }}>
      <span style={{ fontSize:12.5, color:'#64748b', fontWeight:500, whiteSpace:'nowrap', marginRight:6 }}>{label} :</span>
      <span style={{ fontSize:13, color:'#1a2332', fontWeight:600, wordBreak:'break-word' }}>{val(value)}</span>
    </div>
  )
}

function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{ display:'flex', gap:0, borderBottom:'1.5px solid #e8edf2', marginBottom:18, flexWrap:'wrap' }}>
      {tabs.map(t => (
        <button key={t} onClick={() => onChange(t)} style={{
          padding:'9px 16px',
          fontFamily:FONT,
          fontSize:12.5,
          fontWeight:600,
          border:'none',
          background:'none',
          cursor:'pointer',
          color:active === t ? PRIMARY : '#94a3b8',
          borderBottom:`2px solid ${active === t ? PRIMARY : 'transparent'}`,
          marginBottom:-2,
          transition:'color .15s',
          whiteSpace:'nowrap',
          letterSpacing:'0.01em',
        }}>
          {t}
        </button>
      ))}
    </div>
  )
}

function Spinner() {
  return (
    <div style={{ padding:70, display:'flex', flexDirection:'column', alignItems:'center', gap:14, fontFamily:FONT }}>
      <div style={{ width:36, height:36, border:'3px solid #e5e7eb', borderTopColor:ACCENT, borderRadius:'50%', animation:'spin .8s linear infinite' }} />
      <span style={{ fontSize:14, color:'#9ca3af' }}>Loading order details…</span>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

/* ════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════ */
export default function OrderDetail({ basePath = "/orders" }) {
  const { id }   = useParams()
  const navigate = useNavigate()

  const [order,    setOrder]    = useState(null)
  const [oa,       setOa]       = useState(null)
  const [quotation, setQuotation] = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)
  const [commTab, setCommTab] = useState('Commercial Terms')

  useEffect(() => {
    setLoading(true)
    setError(null)

    api.get(`/orders/orders/${id}/`)
      .then(orderRes => {
        const orderData = orderRes.data
        setOrder(orderData)

        const oaUuid = orderData.oa ?? orderData.oa_id
        if (!oaUuid) { setLoading(false); return }

        return api.get(`/orders/oa/${oaUuid}/`)
          .then(oaRes => {
            setOa(oaRes.data)
            
            const quotationUuid = oaRes.data.quotation
            if (quotationUuid) {
              return api.get(`/quotations/${quotationUuid}/`)
                .then(quotationRes => setQuotation(quotationRes.data))
                .catch(err => console.warn('Quotation fetch failed:', err.message))
            }
          })
          .catch(err => console.warn('OA fetch failed:', err.message))
      })
      .catch(err => setError(err.response?.data?.detail ?? err.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <Spinner />
  if (error || !order) {
    return (
      <div style={{ padding:40, textAlign:'center', fontFamily:FONT, color:'#ef4444', fontSize:15 }}>
        {error ?? 'Order not found.'}
      </div>
    )
  }

  // ── Derive data from OA (primary) + Order (fallback) + Quotation ──
  const customer = oa?.customer_detail ?? {}
  const pocs     = customer.pocs ?? []
  const poc      = pocs[0] ?? {}

  const billing  = oa?.billing_snapshot  ?? customer.addresses?.find(a => a.address_type === 'BILLING')  ?? {}
  const shipping = oa?.shipping_snapshot ?? customer.addresses?.find(a => a.address_type === 'SHIPPING') ?? {}

  const tr = oa?.transport_details ?? {}
  const ct = oa?.commercial_terms ?? {}

  const lineItems      = oa?.line_items ?? []
  const totalItems     = lineItems.length
  const completedItems = lineItems.filter(l => l.delivery_status === 'YES' || l.status === 'Completed').length

  const oaNumber        = oa?.oa_number        ?? order.oa_number ?? '—'
  const enquiryNumber   = oa?.enquiry_number   ?? '—'
  const quotationNumber = oa?.quotation_number ?? '—'
  
  // Customer PO Number - bigger and bolder
  const customerPONumber = quotation?.po_number ?? tr.customer_po_number ?? billing.po_number ?? '—'

  return (
    <div style={{ fontFamily:FONT, minHeight:'100vh', background:'#f8f9fb', width:'100%' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>

      {/* TOP BAR */}
      <div style={{ background:'#fff', borderBottom:'1px solid #e8edf2', padding:'14px 28px', display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={() => navigate(-1)} style={{ width:34, height:34, borderRadius:8, border:'1.5px solid #e2e8f0', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Icon d={ic.arrowLeft} size={15} color={PRIMARY} />
          </button>
          <h2 style={{ margin:0, fontSize:18, fontWeight:700, color:PRIMARY }}>Order Details</h2>
        </div>
        <button style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 18px', borderRadius:8, border:'1.5px solid #e2e8f0', background:'#fff', color:PRIMARY, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:FONT }}>
          <Icon d={ic.print} size={14} color={PRIMARY} /> Print Order Details
        </button>
      </div>

      <div style={{ padding:'20px 28px', display:'flex', flexDirection:'column', gap:16 }}>

        {/* ROW 1: Customer Details | Contact (POC) | Delivery Request */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>
          <Card style={{ padding:'18px 20px' }}>
            <SectionHead icon={ic.building} title="Customer Details" />
            <div style={{ display:'flex', flexDirection:'column' }}>
              <InfoRow label="Entity Name" value={customer.company_name} />
              <InfoRow label="Region"      value={customer.region} />
              <InfoRow label="Country"     value={customer.country} />
              <InfoRow label="State"       value={customer.state} />
              <InfoRow label="City"        value={customer.city} />
              <InfoRow label="Address"     value={customer.addresses?.find(a=>a.address_type==='BILLING')?.address_line} />
            </div>
          </Card>

          <Card style={{ padding:'18px 20px' }}>
            <SectionHead icon={ic.user} title="Contact Detail (POC)" />
            <div style={{ display:'flex', flexDirection:'column' }}>
              <InfoRow label="Name"  value={poc.name ?? poc.contact_name} />
              <InfoRow label="Email" value={poc.email} />
              <InfoRow label="Phone" value={poc.phone ?? poc.mobile} />
            </div>
          </Card>

          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <Card style={{ padding:'18px 20px', flex:'none' }}>
              <SectionHead icon={ic.delivery} title="Delivery Request" />
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8 }}>
                <div>
                  <div style={{ fontSize:11.5, color:'#64748b', fontWeight:500, marginBottom:4 }}>Order Status :</div>
                  <div style={{ fontSize:32, fontWeight:700, color:PRIMARY, lineHeight:1 }}>{completedItems}/{totalItems}</div>
                  <div style={{ marginTop:6, fontSize:12.5, fontWeight:600, color: completedItems === totalItems ? '#10b981' : '#f59e0b' }}>
                    {completedItems === totalItems ? 'Completed' : 'Partially Completed'}
                  </div>
                </div>
                <button style={{ padding:'9px 18px', borderRadius:8, border:`1.5px solid ${PRIMARY}`, background:'#fff', color:PRIMARY, fontSize:12.5, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0 }}>
                  Request Delivery
                </button>
              </div>
            </Card>

            <Card style={{ padding:'18px 20px', flex:'none' }}>
              <SectionHead icon={ic.package} title="Back Order Delivery" />
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                <div style={{ background:'#f8f9fb', borderRadius:8, padding:'12px 16px' }}>
                  <div style={{ fontSize:11.5, color:'#64748b', fontWeight:500, marginBottom:4 }}>Total Order</div>
                  <div style={{ fontSize:28, fontWeight:700, color:PRIMARY }}>{totalItems}</div>
                </div>
                <div style={{ background:'#fffbf0', borderRadius:8, padding:'12px 16px' }}>
                  <div style={{ fontSize:11.5, color:'#64748b', fontWeight:500, marginBottom:4 }}>Remaining Order</div>
                  <div style={{ fontSize:28, fontWeight:700, color:'#d97706' }}>{Math.max(0, totalItems - completedItems)}</div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Customer PO Number */}
        <Card style={{ padding:'18px 20px' }}>
          <SectionHead icon={ic.doc} title="Customer PO Number" />
          <div style={{ fontSize:22, fontWeight:700, color:PRIMARY, letterSpacing:'-0.02em', fontFamily:'monospace', wordBreak:'break-word' }}>
            {customerPONumber !== '—' ? customerPONumber : <span style={{ color:'#9ca3af', fontSize:16, fontWeight:500 }}>Not available</span>}
          </div>
        </Card>

        {/* ORDER STATUS STAGE PIPELINE */}
        <div style={{ background:'#fff', borderRadius:10, border:'1px solid #e8edf2', padding:'18px 20px', boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
            <span style={{ fontSize:14, fontWeight:700, color:PRIMARY }}>Order Status</span>
            <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 12px', borderRadius:20, background:'#fef9ec', border:'1px solid #f6d860', color:'#b45309', fontSize:12, fontWeight:600 }}>
              <svg width={7} height={7}><circle cx={3.5} cy={3.5} r={3} fill="#f59e0b"/></svg>
              {order.stage ? order.stage.replace(/_/g,' ') : 'In Production'}
            </span>
          </div>
          <StageProgress currentStage={order.stage ?? 'PRODUCTION'} />
        </div>

        {/* ORDER DETAILS */}
        <Card style={{ padding:'18px 20px' }}>
          <FlatSectionHead title="Order Details" />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'8px 24px' }}>
            <FlatRow label="Order Number"      value={order.order_number} />
            <FlatRow label="Order Type"        value={tr.order_type} />
            <FlatRow label="Order Book Number" value={tr.order_book_number} />
            <FlatRow label="Order Date"        value={fmtDate(tr.order_date)} />
            <FlatRow label="Order Date"        value={fmtDate(tr.order_date)} />
            <FlatRow label="Quote Date"        value={fmtDate(tr.quote_date)} />
            <FlatRow label="PO Date"           value={fmtDate(tr.po_date)} />
            <FlatRow label="Delivery Date"     value={fmtDate(tr.delivery_date)} />
            <FlatRow label="Order Book Number" value={tr.order_book_number} />
            <FlatRow label="Customer PO Number" value={customerPONumber} />
            <div style={{ gridColumn:'span 2' }} />
            <FlatRow label="Division"          value={tr.division} />
            <FlatRow label="Project Type"      value={tr.project_type} />
          </div>
        </Card>

        {/* TRANSPORTATION DETAIL */}
        <Card style={{ padding:'18px 20px' }}>
          <FlatSectionHead title="Transportation Detail" />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px 24px' }}>
            <FlatRow label="Mode of Transport"    value={tr.mode_of_transport} />
            <FlatRow label="Preferred Transporter" value={tr.preferred_transporter} />
            <FlatRow label="Packing type"         value={tr.packing_type} />
            <FlatRow label="ECC Exemption Letter" value={tr.ecc_exemption} />
            <FlatRow label="Road Permit"          value={tr.road_permit} />
            <FlatRow label="Shipping GST Number"  value={tr.shipping_gst} />
            <FlatRow label="LOI Number"           value={tr.loi_number} />
            <FlatRow label="Project Name"         value={tr.project_name} />
          </div>
        </Card>

        {/* BILLING & SHIPPING ADDRESSES */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <Card style={{ padding:'18px 20px' }}>
            <FlatSectionHead title="Billing Address" />
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px 24px' }}>
              <FlatRow label="Entity Name"    value={billing.entity_name} />
              <FlatRow label="Contact Person" value={billing.contact_person} />
              <FlatRow label="E-mail ID"      value={billing.contact_email} />
              <FlatRow label="Contact Number" value={billing.contact_number} />
              <div style={{ gridColumn:'span 2' }}>
                <FlatRow label="Address" value={billing.address_line} />
              </div>
            </div>
          </Card>

          <Card style={{ padding:'18px 20px' }}>
            <FlatSectionHead title="Shipping Address" />
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px 24px' }}>
              <FlatRow label="Entity Name"    value={shipping.entity_name} />
              <FlatRow label="Contact Person" value={shipping.contact_person} />
              <FlatRow label="E-mail ID"      value={shipping.contact_email} />
              <FlatRow label="Contact Number" value={shipping.contact_number} />
              <div style={{ gridColumn:'span 2' }}>
                <FlatRow label="Address" value={shipping.address_line} />
              </div>
            </div>
          </Card>
        </div>

        {/* ORDER DETAILS LINE ITEMS */}
        <Card noPadding>
          <div style={{ padding:'18px 20px 10px' }}>
            <FlatSectionHead title="Order Details" />
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12.5 }}>
              <thead>
                <tr style={{ background:PRIMARY }}>
                  {['Job Code','Cust. Part No','Part No.','Description','HSN Code','Quantity','Unit','Unit Price','Total','Tax Group Code','Status','Delivery Status'].map(h => (
                    <th key={h} style={{ padding:'10px 12px', textAlign:'left', fontSize:11, fontWeight:600, color:'#e2e8f0', whiteSpace:'nowrap', borderRight:'1px solid rgba(255,255,255,0.07)', textTransform:'uppercase', letterSpacing:'0.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lineItems.length === 0 ? (
                  <tr><td colSpan={12} style={{ padding:28, textAlign:'center', color:'#9ca3af', fontSize:13 }}>No line items</td></tr>
                ) : lineItems.map((item, i) => (
                  <tr key={item.id ?? i} style={{ background:i%2===0?'#fafafa':'#fff', borderBottom:'1px solid #f0f2f5' }}>
                    <td style={TD}>{item.job_code || '—'}</td>
                    <td style={TD}>{item.customer_part_no || '—'}</td>
                    <td style={TD}>{item.part_no || '—'}</td>
                    <td style={{ ...TD, maxWidth:160, whiteSpace:'normal' }}>{item.description?.slice(0, 40)}</td>
                    <td style={TD}>{item.hsn_code || item.hsn_snapshot || '—'}</td>
                    <td style={TD}>{item.quantity}</td>
                    <td style={TD}>{item.unit || 'NOS'}</td>
                    <td style={TD}>{fmtMoney(item.unit_price)}</td>
                    <td style={{ ...TD, fontWeight:600 }}>{fmtMoney(item.total)}</td>
                    <td style={TD}>{item.tax_group_code || '—'}</td>
                    <td style={TD}>
                      <span style={{ padding:'3px 10px', borderRadius:20, background:'#ecfdf5', color:'#059669', fontSize:11, fontWeight:600, whiteSpace:'nowrap' }}>Completed</span>
                    </td>
                    <td style={TD}>
                      <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, whiteSpace:'nowrap',
                        background: item.delivery_status === 'YES' ? '#ecfdf5' : '#fef9ec',
                        color:      item.delivery_status === 'YES' ? '#059669'  : '#d97706',
                      }}>
                        {item.delivery_status === 'YES' ? 'Yes' : 'No'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial summary */}
          {(ct.net_amount != null || ct.total_amount != null) && (
            <div style={{ padding:'12px 20px', borderTop:'1px solid #edf2f7', display:'flex', justifyContent:'flex-end', gap:28 }}>
              {[['Net', ct.net_amount], ['IGST', ct.igst], ['CGST', ct.cgst], ['SGST', ct.sgst], ['Total', ct.total_amount]].map(([l, v]) => v != null && (
                <div key={l} style={{ textAlign:'right' }}>
                  <div style={{ fontSize:10.5, color:'#9ca3af', fontWeight:600 }}>{l}</div>
                  <div style={{ fontSize:13, fontWeight:700, color: l === 'Total' ? PRIMARY : '#374151' }}>{fmtMoney(v)}</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* COMMERCIAL TERMS */}
        {oa?.commercial_terms && (
          <Card style={{ padding:'18px 20px' }}>
            <FlatSectionHead title="Commercial Terms" />
            <Tabs tabs={COMMERCIAL_TABS} active={commTab} onChange={setCommTab} />

            {/* Commercial Terms Tab */}
            {commTab === 'Commercial Terms' && (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px 16px' }}>
                <TermRow label="Currency" value={ct.currency} />
                <TermRow label="Warranty Details" value={ct.warranty_details} />
                <TermRow label="Net Amount" value={fmtMoney(ct.net_amount)} />
                <TermRow label="CGST" value={fmtMoney(ct.cgst)} />
                <TermRow label="SGST" value={fmtMoney(ct.sgst)} />
                <TermRow label="IGST" value={fmtMoney(ct.igst)} />
                <TermRow label="UTGST" value={fmtMoney(ct.utgst)} />
                <TermRow label="Total Amount" value={fmtMoney(ct.total_amount)} />
                <TermRow label="Brief Description" value={ct.brief_description} />
                <TermRow label="Remark" value={ct.remark} />
              </div>
            )}

            {/* Terms + Conditions Tab */}
            {commTab === 'Terms + Conditions' && (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px 16px' }}>
                <TermRow label="Payment Terms" value={ct.payment_terms} />
                <TermRow label="Advance %" value={ct.advance_percentage} />
                <TermRow label="Days After Invoicing" value={ct.days_after_invoicing} />
                <TermRow label="Price Basis" value={ct.price_basis} />
                <TermRow label="Insurance" value={ct.insurance} />
                <TermRow label="Inspection" value={ct.inspection} />
                <TermRow label="LD Clause" value={ct.ld_clause} />
                <TermRow label="Test Certificate" value={ct.test_certificate} />
                <TermRow label="Warranty" value={ct.warranty} />
                <TermRow label="Drawing Approval" value={ct.drawing_approval} />
                <TermRow label="Freight Charges" value={ct.freight_charges} />
                <TermRow label="ABG Format" value={ct.abg_format} />
                <TermRow label="PBG Format" value={ct.pbg_format} />
                <TermRow label="SD Format" value={ct.sd_format} />
                <TermRow label="Dispatch Clearance" value={ct.dispatch_clearance} />
                <TermRow label="Commissioning Support" value={ct.commissioning_support} />
                <TermRow label="Schedule Dispatch" value={fmtDate(ct.schedule_dispatch_date)} />
              </div>
            )}

            {/* Factory Details Tab */}
            {commTab === 'Factory Details' && (
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                {[
                  ['Order Processing', 'order_processing'],
                  ['Regional Manager', 'regional_manager'],
                  ['Project Exec', 'project_exec'],
                  ['Customer Support (1)', 'customer_support_1'],
                  ['Customer Support (2)', 'customer_support_2'],
                ].map(([label, key]) => (
                  <div key={key}>
                    <div style={{ fontSize:13, fontWeight:600, color:PRIMARY, marginBottom:6 }}>{label}</div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
                      <TermRow label="Name" value={ct[`${key}_name`]} />
                      <TermRow label="Email" value={ct[`${key}_email`]} />
                      <TermRow label="Phone" value={ct[`${key}_phone`]} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Channel Partner Tab */}
            {commTab === 'Channel Partner' && (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px 16px' }}>
                <TermRow label="Channel Partner" value={ct.channel_partner_name} />
                <TermRow label="Commission %" value={ct.commission_percentage} />
                <TermRow label="Commission Amount" value={fmtMoney(ct.commission_amount)} />
                <TermRow label="Consultant Name" value={ct.consultant_name} />
                <TermRow label="Consultant Charges" value={fmtMoney(ct.consultant_charges)} />
              </div>
            )}

            {/* Order Cancellation Tab */}
            {commTab === 'Order Cancellation' && (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'12px 16px', maxWidth:600 }}>
                <TermRow label="Order Cancellation" value={ct.order_cancellation} />
                {ct.order_cancellation === 'Yes' && (
                  <>
                    <TermRow label="Cancelled By" value={ct.order_cancelled_by} />
                    <div style={{ gridColumn:'span 2' }}>
                      <TermRow label="Reason" value={ct.cancellation_reason} />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Short Supply Tab */}
            {commTab === 'Short Supply' && (
              <div>
                <div style={{ fontSize:13, color:'#6b7280', marginBottom:8 }}>Short supplied items will appear here</div>
                <div style={{ fontSize:12, color:'#9ca3af', fontStyle:'italic' }}>No short supply items recorded</div>
              </div>
            )}
          </Card>
        )}

        {/* FINANCIAL SUMMARY */}
        <Card style={{ padding:'18px 20px' }}>
          <FlatSectionHead title="Financial Summary" />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'8px 24px' }}>
            <FlatRow label="Currency"      value={order.currency} />
            <FlatRow label="Exchange Rate" value={order.exchange_rate} />
            <FlatRow label="Total Value"   value={fmtMoney(order.total_value)} />
            <FlatRow label="Advance Paid"  value={fmtMoney(order.advance_paid)} />
            <FlatRow label="OA Number"     value={oaNumber} />
            <FlatRow label="Enquiry No."   value={enquiryNumber} />
            <FlatRow label="Quotation No." value={quotationNumber} />
            <FlatRow label="Order Status"  value={order.status} />
          </div>
        </Card>

      </div>
    </div>
  )
}

const TD = { padding:'8px 12px', fontSize:12.5, color:'#374151', verticalAlign:'middle', whiteSpace:'nowrap' }