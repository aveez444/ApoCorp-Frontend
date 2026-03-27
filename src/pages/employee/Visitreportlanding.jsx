import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import NewVisitReportModal from '../../components/modals/NewVisitReportModal'
import Toast from '../../components/Toast'

const PRIMARY = '#122C41'
const ACCENT  = '#1e88e5'
const FONT    = "'Inter', 'Segoe UI', sans-serif"

const Icon = ({ d, size = 16, color = 'currentColor', fill = 'none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)
const ic = {
  plus:       'M12 5v14M5 12h14',
  print:      'M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z',
  export:     'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
  search:     'M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z',
  chevRight:  'M9 18l6-6-6-6',
  file:       'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6',
  calendar:   'M3 4h18v18H3zM16 2v4M8 2v4M3 10h18',
  arrowRight: 'M5 12h14M12 5l7 7-7 7',
}

const PAGE_SIZE = 10

const fmt = (d) => {
  if (!d) return '—'
  const dt = new Date(d)
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function VisitReportLanding({ basePath = '/employee/reports/visit-reports' }) {
  const navigate = useNavigate()
  const [reports, setReports]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [date, setDate]         = useState('')
  const [page, setPage]         = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [toast, setToast]       = useState(null)

  const fetchReports = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    api.get(`/reports/visit-reports/?${params}`)
      .then(r => setReports(r.data?.results || r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line

  useEffect(() => { fetchReports() }, [fetchReports])

  const handleSearch = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    if (date)   params.append('date', date)
    api.get(`/reports/visit-reports/?${params}`)
      .then(r => { setReports(r.data?.results || r.data || []); setPage(1) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  // Sort newest first
  const sorted = [...reports].sort((a, b) => {
    if (!a.created_at && !b.created_at) return 0
    if (!a.created_at) return 1
    if (!b.created_at) return -1
    return new Date(b.created_at) - new Date(a.created_at)
  })

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const paginated  = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleExport = () => {
    const headers = ['Visit Number', 'Date', 'Type of Report', 'Company Name', 'Department', 'Author', 'Attendants', 'Subject', 'Agenda']
    const rows = sorted.map(r => [
      r.visit_number, r.date, r.type_of_report,
      r.company_name, r.department, r.author,
      r.attendants, r.subject, r.agenda,
    ])
    const csv = [headers, ...rows].map(row => row.map(v => `"${v || ''}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = 'visit_reports.csv'
    a.click()
  }

  return (
    <div style={{ fontFamily: FONT, color: '#1a1a2e', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
        .vr-row:hover { background: #f0f5ff !important; cursor: pointer; }
        input:focus { outline: none; border-color: ${ACCENT} !important; }
        ::-webkit-scrollbar { height:5px; width:5px; }
        ::-webkit-scrollbar-thumb { background:#cbd5e1; border-radius:99px; }
        .vr-btn-action:hover { background: #f8fafc !important; }
        .vr-see-all:hover { color: ${PRIMARY} !important; }
      `}</style>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {/* Hero Banner */}
      <div style={{
        borderRadius: 16,
        background: `linear-gradient(135deg, ${PRIMARY} 0%, #1a3d5c 60%, #1e5080 100%)`,
        padding: '28px 36px',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* bg decoration */}
        <div style={{ position: 'absolute', right: -30, top: -30, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,.04)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: 80, bottom: -50, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,.03)', pointerEvents: 'none' }} />
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#fff', fontFamily: FONT }}>
            Visit Reports
            <span style={{ fontSize: 16, fontWeight: 500, color: 'rgba(255,255,255,.55)', marginLeft: 10 }}>
              ({sorted.length})
            </span>
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 13.5, color: 'rgba(255,255,255,.6)', fontFamily: FONT }}>
            Log and track all customer / site visit reports.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '11px 22px', border: 'none', borderRadius: 10,
            background: ACCENT, color: '#fff',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
            fontFamily: FONT, boxShadow: '0 4px 14px rgba(30,136,229,.4)',
            flexShrink: 0,
          }}
        >
          <Icon d={ic.plus} size={15} color="#fff" />
          New Report
        </button>
      </div>

      {/* Search bar */}
      <div style={{
        background: '#fff', borderRadius: 14,
        padding: '18px 22px', boxShadow: '0 2px 12px rgba(0,0,0,.06)',
        marginBottom: 20,
        display: 'grid', gridTemplateColumns: '1fr 200px auto auto auto', gap: 12, alignItems: 'center',
      }}>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <Icon d={ic.search} size={14} color="#9ca3af" />
          </span>
          <input
            style={{ ...searchInput, paddingLeft: 36 }}
            placeholder="Visit No / Company / Author"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <input
          type="date"
          style={searchInput}
          value={date}
          onChange={e => setDate(e.target.value)}
        />
        <button onClick={handleSearch} style={primaryBtn}>
          <Icon d={ic.search} size={13} color="#fff" /> Search
        </button>
        <button onClick={() => window.print()} style={actionBtn} className="vr-btn-action">
          <Icon d={ic.print} size={13} color="#475569" /> Print
        </button>
        <button onClick={handleExport} style={actionBtn} className="vr-btn-action">
          <Icon d={ic.export} size={13} color="#475569" /> Export
        </button>
      </div>

      {/* Table */}
      <div style={{
        background: '#fff', borderRadius: 14,
        boxShadow: '0 2px 12px rgba(0,0,0,.06)',
        overflow: 'hidden', animation: 'fadeUp .3s ease',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900, fontSize: 13.5 }}>
            <thead>
              <tr style={{ background: PRIMARY }}>
                {['Visit Number', 'Date', 'Type of Report', 'Company Name', 'Department', 'Author', 'Attendants', 'Subject', 'Agenda'].map(h => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ padding: 44, textAlign: 'center', color: '#94a3b8' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    <div style={{ width: 18, height: 18, border: '2px solid #e2e8f0', borderTopColor: PRIMARY, borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
                    Loading reports…
                  </div>
                </td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={9} style={{ padding: 60, textAlign: 'center' }}>
                  <div>
                    <div style={{ width: 52, height: 52, background: '#f1f5f9', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                      <Icon d={ic.file} size={24} color="#94a3b8" />
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#374151', fontFamily: FONT, marginBottom: 6 }}>No visit reports yet</div>
                    <div style={{ fontSize: 13, color: '#9ca3af', fontFamily: FONT, marginBottom: 18 }}>Click "New Report" to create your first visit report.</div>
                    <button
                      onClick={() => setModalOpen(true)}
                      style={{ ...primaryBtn, margin: '0 auto' }}
                    >
                      <Icon d={ic.plus} size={13} color="#fff" /> Create First Report
                    </button>
                  </div>
                </td></tr>
              ) : paginated.map((r, i) => (
                <tr
                  key={r.id}
                  className="vr-row"
                  onClick={() => navigate(`${basePath}/${r.id}`)}
                  style={{
                    background: i % 2 === 0 ? '#fafafa' : '#fff',
                    borderBottom: '1px solid #f1f5f9',
                    transition: 'background .1s',
                  }}
                >
                  <td style={{ ...td, color: PRIMARY, fontWeight: 700, fontFamily: 'monospace', fontSize: 12.5 }}>
                    {r.visit_number}
                  </td>
                  <td style={td}>{fmt(r.date)}</td>
                  <td style={td}>{r.type_of_report || '—'}</td>
                  <td style={{ ...td, fontWeight: 600, color: '#111827' }}>{r.company_name || '—'}</td>
                  <td style={td}>{r.department || '—'}</td>
                  <td style={td}>{r.author || '—'}</td>
                  <td style={{ ...td, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.attendants || '—'}
                  </td>
                  <td style={{ ...td, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.subject || '—'}
                  </td>
                  <td style={{ ...td, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#6b7280' }}>
                    {r.agenda || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination + See All */}
        {sorted.length > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 22px', borderTop: '1px solid #f1f5f9',
          }}>
            <span style={{ fontSize: 13, color: '#6b7280', fontFamily: FONT }}>
              Showing {Math.min((page - 1) * PAGE_SIZE + 1, sorted.length)}–{Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length}
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {totalPages > 1 && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    style={{ ...pageBtn, opacity: page === 1 ? .4 : 1 }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let p = i + 1
                    if (totalPages > 5 && page > 3) p = page - 2 + i
                    if (p > totalPages) return null
                    return (
                      <button key={p} onClick={() => setPage(p)}
                        style={{ ...pageBtn, background: p === page ? PRIMARY : '#fff', color: p === page ? '#fff' : PRIMARY, fontWeight: p === page ? 700 : 500 }}
                      >{p}</button>
                    )
                  })}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    style={{ ...pageBtn, opacity: page === totalPages ? .4 : 1 }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
                  </button>
                </div>
              )}

              <button
                className="vr-see-all"
                onClick={() => navigate(`${basePath}/all`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: 600, color: ACCENT, fontFamily: FONT,
                  marginLeft: 8, padding: '6px 10px',
                }}
              >
                See all reports
                <Icon d={ic.arrowRight} size={13} color={ACCENT} />
              </button>
            </div>
          </div>
        )}
      </div>

      {modalOpen && (
        <NewVisitReportModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={(msg) => {
            setModalOpen(false)
            setToast(msg || 'Visit report created!')
            fetchReports()
          }}
        />
      )}
    </div>
  )
}

const th = {
  padding: '12px 16px', color: '#fff', fontWeight: 600,
  textAlign: 'left', whiteSpace: 'nowrap', fontSize: 13,
  fontFamily: "'Inter','Segoe UI',sans-serif",
  borderRight: '1px solid rgba(255,255,255,.08)',
}
const td = {
  padding: '12px 16px', color: '#374151',
  borderRight: '1px solid #f1f5f9', whiteSpace: 'nowrap', verticalAlign: 'middle',
}
const searchInput = {
  width: '100%', padding: '10px 14px',
  border: '1.5px solid #e5e7eb', borderRadius: 8,
  fontSize: 13.5, fontFamily: "'Inter','Segoe UI',sans-serif", color: '#111827',
  background: '#fff', transition: 'border .15s',
}
const actionBtn = {
  display: 'flex', alignItems: 'center', gap: 6,
  padding: '9px 14px', border: '1.5px solid #e5e7eb',
  borderRadius: 8, background: '#fff', color: '#475569',
  fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
  fontFamily: "'Inter','Segoe UI',sans-serif", whiteSpace: 'nowrap',
}
const primaryBtn = {
  display: 'flex', alignItems: 'center', gap: 6,
  padding: '9px 18px', border: 'none', borderRadius: 8,
  background: PRIMARY, color: '#fff',
  fontSize: 13, fontWeight: 700, cursor: 'pointer',
  fontFamily: "'Inter','Segoe UI',sans-serif", whiteSpace: 'nowrap',
}
const pageBtn = {
  width: 34, height: 34, borderRadius: 8,
  border: '1.5px solid #e5e7eb', background: '#fff',
  color: PRIMARY, fontSize: 13, fontWeight: 600,
  cursor: 'pointer', fontFamily: "'Inter','Segoe UI',sans-serif",
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}