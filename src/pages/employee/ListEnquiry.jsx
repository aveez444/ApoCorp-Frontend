import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import NewEnquiryModal from '../../components/modals/NewEnquiryModal'
import Toast from '../../components/Toast'
import { printEnquiryReport } from '../../components/PrintEnquiryReport'
import { exportToPDF } from '../../components/ExportToPDF'

const PRIMARY = '#122C41'
const ACCENT  = '#1e88e5'
const FONT    = "'Inter', 'Segoe UI', sans-serif"

const Icon = ({ d, size = 16, color = 'currentColor', fill = 'none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

const ic = {
  arrowLeft:  'M19 12H5M12 19l-7-7 7-7',
  plus:       'M12 5v14M5 12h14',
  print:      'M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z',
  export:     'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
  search:     'M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z',
  filter:     'M22 3H2l8 9.46V19l4 2v-8.54L22 3z',
  x:          'M18 6L6 18M6 6l12 12',
  chevLeft:   'M15 18l-6-6 6-6',
  chevRight:  'M9 18l6-6-6-6',
}

const STATUS_COLORS = {
  NEW:         { bg: '#eff6ff', color: '#1d4ed8', dot: '#3b82f6' },
  NEGOTIATION: { bg: '#fefce8', color: '#92400e', dot: '#f59e0b' },
  PO_RECEIVED: { bg: '#f0fdf4', color: '#166534', dot: '#22c55e' },
  LOST:        { bg: '#fef2f2', color: '#991b1b', dot: '#ef4444' },
  REGRET:      { bg: '#fdf4ff', color: '#6b21a8', dot: '#a855f7' },
}
const STATUS_LABELS = {
  NEW: 'New Enquiry', NEGOTIATION: 'Under Negotiation',
  PO_RECEIVED: 'PO Received', LOST: 'Enquiry Lost', REGRET: 'Regret',
}
const ALL_STATUSES = Object.keys(STATUS_LABELS)

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || { bg:'#f1f5f9', color:'#64748b', dot:'#94a3b8' }
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:5,
      background:s.bg, color:s.color,
      fontSize:11.5, fontWeight:600, fontFamily:FONT,
      padding:'4px 10px', borderRadius:99,
    }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background:s.dot, display:'inline-block', flexShrink:0 }} />
      {STATUS_LABELS[status] || status}
    </span>
  )
}

const fmt = n => new Intl.NumberFormat('en-IN').format(n ?? 0)
const PAGE_SIZE = 15

export default function ListEnquiry({ basePath = '/employee/enquiries' }) {
  const navigate = useNavigate()
  const [enquiries, setEnquiries] = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [location, setLocation]   = useState('')
  const [date, setDate]           = useState('')
  const [activeFilters, setActiveFilters] = useState([])
  const [page, setPage]           = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [toast, setToast]         = useState(null)

  const fetchEnquiries = useCallback(() => {
    setLoading(true)
    api.get('/enquiries/')
      .then(r => setEnquiries(r.data?.results || r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchEnquiries() }, [fetchEnquiries])

  const toggleFilter = (status) => {
    setActiveFilters(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    )
    setPage(1)
  }

  const filtered = enquiries
    .filter(e => {
      const name = e.customer_detail?.company_name?.toLowerCase() || ''
      const num = e.enquiry_number?.toLowerCase() || ''
      const loc = [e.customer_detail?.city, e.customer_detail?.state, e.customer_detail?.country].filter(Boolean).join(' ').toLowerCase()
      const matchSearch = !search || name.includes(search.toLowerCase()) || num.includes(search.toLowerCase())
      const matchLocation = !location || loc.includes(location.toLowerCase())
      const matchDate = !date || e.enquiry_date === date
      const matchStatus = activeFilters.length === 0 || activeFilters.includes(e.status)
      return matchSearch && matchLocation && matchDate && matchStatus
    })
    // Sort by created_at descending (newest first)
    .sort((a, b) => {
      if (!a.created_at && !b.created_at) return 0
      if (!a.created_at) return 1
      if (!b.created_at) return -1
      return new Date(b.created_at) - new Date(a.created_at)
    })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleExport = () => {
    const headers = ['Enquiry Number','Date','Target Date','Entity Name','Prospective Value','Phone','Enq. Type','Location','Status']
    const rows = filtered.map(e => [
      e.enquiry_number, e.enquiry_date, e.target_submission_date,
      e.customer_detail?.company_name || '',
      e.prospective_value || 0,
      e.customer_detail?.telephone_primary || '',
      e.enquiry_type || '',
      [e.customer_detail?.city, e.customer_detail?.country].filter(Boolean).join(', '),
      STATUS_LABELS[e.status] || e.status,
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = 'enquiries.csv'; a.click()
  }

  const handlePrint = () => {
  printEnquiryReport(filtered, null) // Pass null for stats since ListEnquiry doesn't have stats
}

const handlePDFDownload = () => {
  exportToPDF(filtered, null) // Pass null for stats since ListEnquiry doesn't have stats
}

  return (
    <div style={{ fontFamily:FONT, color:'#1a1a2e', minHeight:'100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
        .row-hover:hover { background: #f0f5ff !important; cursor: pointer; }
        .chip:hover { opacity:.8; }
        input:focus, select:focus { outline: none; border-color: ${ACCENT} !important; }
        ::-webkit-scrollbar { height:5px; width:5px; }
        ::-webkit-scrollbar-thumb { background:#cbd5e1; border-radius:99px; }
      `}</style>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <button
            onClick={() => navigate(-1)}
            style={{ width:36, height:36, borderRadius:9, border:'1.5px solid #e5e7eb', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}
          >
            <Icon d={ic.arrowLeft} size={16} color="#6b7280" />
          </button>
          <div>
            <h1 style={{ margin:0, fontSize:22, fontWeight:700, color:PRIMARY }}>
              Enquiry Stats
              <span style={{ fontSize:15, fontWeight:500, color:'#6b7280', marginLeft:8 }}>({fmt(filtered.length)})</span>
            </h1>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handlePrint} style={actionBtn}>
            <Icon d={ic.print} size={13} color="#475569" /> Print Report
          </button>
          <button onClick={handlePDFDownload} style={actionBtn}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 10v6m0 0l-3-3m3 3l3-3m-6 6h6M4 4h16v16H4z" />
            </svg>
            Download PDF
          </button>
          <button onClick={handleExport} style={actionBtn}>
            <Icon d={ic.export} size={13} color="#475569" /> Export to Excel
          </button>
          <button onClick={() => setModalOpen(true)} style={primaryBtn}>
            <Icon d={ic.plus} size={14} color="#fff" /> New Enquiry
          </button>
        </div>
      </div>

      {/* Search & Filters card */}
      <div style={{ background:'#fff', borderRadius:14, padding:'20px 24px', boxShadow:'0 2px 12px rgba(0,0,0,.06)', marginBottom:20 }}>
        {/* Search row */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr auto', gap:14, marginBottom:16 }}>
          <div style={{ position:'relative' }}>
            <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}>
              <Icon d={ic.search} size={14} color="#9ca3af" />
            </span>
            <input
              placeholder="Enter Enquiry Name / Number"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              style={{ ...searchInput, paddingLeft:38 }}
            />
            <span style={{ position:'absolute', left:0, top:-9, background:'#fff', padding:'0 4px', fontSize:11, fontWeight:600, color:'#9ca3af', fontFamily:FONT }}>Search Enquiry</span>
          </div>

          <div style={{ position:'relative' }}>
            <input
              placeholder="Enter Location"
              value={location}
              onChange={e => { setLocation(e.target.value); setPage(1) }}
              style={searchInput}
            />
            <span style={{ position:'absolute', left:0, top:-9, background:'#fff', padding:'0 4px', fontSize:11, fontWeight:600, color:'#9ca3af', fontFamily:FONT }}>Location</span>
          </div>

          <div style={{ position:'relative' }}>
            <input
              type="date"
              value={date}
              onChange={e => { setDate(e.target.value); setPage(1) }}
              style={searchInput}
            />
            <span style={{ position:'absolute', left:0, top:-9, background:'#fff', padding:'0 4px', fontSize:11, fontWeight:600, color:'#9ca3af', fontFamily:FONT }}>Date</span>
          </div>

          <button
            onClick={() => { setSearch(''); setLocation(''); setDate(''); setActiveFilters([]); setPage(1) }}
            style={{ ...actionBtn, display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap' }}
          >
            <Icon d={ic.filter} size={13} color="#475569" /> Filters
          </button>
        </div>

        {/* Status chips */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
          {ALL_STATUSES.map(status => {
            const active = activeFilters.includes(status)
            const s = STATUS_COLORS[status]
            return (
              <button
                key={status}
                className="chip"
                onClick={() => toggleFilter(status)}
                style={{
                  display:'inline-flex', alignItems:'center', gap:6,
                  padding:'5px 12px', borderRadius:99, cursor:'pointer',
                  border:`1.5px solid ${active ? s.dot : '#e5e7eb'}`,
                  background: active ? s.bg : '#fff',
                  color: active ? s.color : '#6b7280',
                  fontSize:12.5, fontWeight:600, fontFamily:FONT,
                  transition:'all .15s',
                }}
              >
                <span style={{ width:6, height:6, borderRadius:'50%', background: active ? s.dot : '#d1d5db', flexShrink:0 }} />
                {STATUS_LABELS[status]}
                {active && (
                  <span style={{ marginLeft:2, display:'flex', alignItems:'center' }}>
                    <Icon d={ic.x} size={10} color={s.color} />
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Table */}
      <div style={{ background:'#fff', borderRadius:14, boxShadow:'0 2px 12px rgba(0,0,0,.06)', overflow:'hidden', animation:'fadeUp .3s ease' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:900, fontSize:13.5 }}>
            <thead>
              <tr style={{ background:PRIMARY }}>
                {['Enquiry Number','Date','Target Date Submission','Entity Name','Prospective Value','Phone (Mobile)','Enq. Type','Location','Status'].map(h => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ padding:44, textAlign:'center', color:'#94a3b8' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
                    <div style={{ width:18, height:18, border:'2px solid #e2e8f0', borderTopColor:PRIMARY, borderRadius:'50%', animation:'spin .8s linear infinite' }} />
                    Loading enquiries…
                  </div>
                </td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={9} style={{ padding:44, textAlign:'center', color:'#94a3b8', fontSize:14 }}>
                  No enquiries match your filters.
                </td></tr>
              ) : paginated.map((e, i) => (
                <tr
                  key={e.id}
                  className="row-hover"
                  onClick={() => navigate(`${basePath}/${e.id}`)}
                  style={{ background: i % 2 === 0 ? '#fafafa' : '#fff', borderBottom:'1px solid #f1f5f9', transition:'background .1s' }}
                >
                  <td style={{ ...td, color:PRIMARY, fontWeight:700, fontFamily:'monospace', fontSize:12.5 }}>{e.enquiry_number}</td>
                  <td style={td}>{e.enquiry_date || '—'}</td>
                  <td style={td}>{e.target_submission_date || '—'}</td>
                  <td style={{ ...td, fontWeight:600, color:'#111827' }}>{e.customer_detail?.company_name || '—'}</td>
                  <td style={td}>{e.prospective_value ? `${e.currency || 'INR'} ${fmt(e.prospective_value)}` : '—'}</td>
                  <td style={{ ...td, color:ACCENT }}>{e.customer_detail?.telephone_primary || '—'}</td>
                  <td style={td}>{e.enquiry_type || '—'}</td>
                  <td style={td}>{[e.customer_detail?.city, e.customer_detail?.country].filter(Boolean).join(', ') || '—'}</td>
                  <td style={td}><StatusBadge status={e.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 24px', borderTop:'1px solid #f1f5f9' }}>
            <span style={{ fontSize:13, color:'#6b7280', fontFamily:FONT }}>
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div style={{ display:'flex', gap:6 }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ ...pageBtn, opacity: page === 1 ? .4 : 1 }}
              >
                <Icon d={ic.chevLeft} size={14} color={PRIMARY} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let p = i + 1
                if (totalPages > 5 && page > 3) p = page - 2 + i
                if (p > totalPages) return null
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    style={{ ...pageBtn, background: p === page ? PRIMARY : '#fff', color: p === page ? '#fff' : PRIMARY, fontWeight: p === page ? 700 : 500 }}
                  >
                    {p}
                  </button>
                )
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{ ...pageBtn, opacity: page === totalPages ? .4 : 1 }}
              >
                <Icon d={ic.chevRight} size={14} color={PRIMARY} />
              </button>
            </div>
          </div>
        )}
      </div>

      {modalOpen && (
        <NewEnquiryModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={(msg) => {
            setModalOpen(false)
            setToast(msg || 'Enquiry created successfully!')
            fetchEnquiries()
          }}
        />
      )}
    </div>
  )
}

const th = {
  padding:'12px 16px', color:'#fff', fontWeight:600,
  textAlign:'left', whiteSpace:'nowrap', fontSize:13,
  fontFamily:"'Inter','Segoe UI',sans-serif",
  borderRight:'1px solid rgba(255,255,255,.08)',
}
const td = {
  padding:'12px 16px', color:'#374151',
  borderRight:'1px solid #f1f5f9', whiteSpace:'nowrap', verticalAlign:'middle',
}
const searchInput = {
  width:'100%', padding:'11px 14px',
  border:'1.5px solid #e5e7eb', borderRadius:8,
  fontSize:13.5, fontFamily:FONT, color:'#111827',
  background:'#fff', transition:'border .15s',
}
const actionBtn = {
  display:'flex', alignItems:'center', gap:6,
  padding:'8px 14px', border:'1.5px solid #e5e7eb',
  borderRadius:8, background:'#fff', color:'#475569',
  fontSize:12.5, fontWeight:500, cursor:'pointer', fontFamily:FONT,
}
const primaryBtn = {
  display:'flex', alignItems:'center', gap:6,
  padding:'9px 18px', border:'none', borderRadius:8,
  background:PRIMARY, color:'#fff',
  fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:FONT,
}
const pageBtn = {
  width:34, height:34, borderRadius:8,
  border:`1.5px solid #e5e7eb`, background:'#fff',
  color:PRIMARY, fontSize:13, fontWeight:600,
  cursor:'pointer', fontFamily:FONT,
  display:'flex', alignItems:'center', justifyContent:'center',
}