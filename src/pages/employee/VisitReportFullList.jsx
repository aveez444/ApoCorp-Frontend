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
  arrowLeft:  'M19 12H5M12 19l-7-7 7-7',
  plus:       'M12 5v14M5 12h14',
  print:      'M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z',
  export:     'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
  search:     'M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z',
  sortAsc:    'M3 6h18M7 12h10M11 18h4',
  chevLeft:   'M15 18l-6-6 6-6',
  chevRight:  'M9 18l6-6-6-6',
}

const PAGE_SIZE = 20

const fmt = (d) => {
  if (!d) return '—'
  const dt = new Date(d)
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function VisitReportFullList({ basePath = '/employee/reports/visit-reports' }) {
  const navigate = useNavigate()
  const [reports, setReports]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [date, setDate]         = useState('')
  const [sortField, setSortField] = useState('created_at')
  const [sortDir, setSortDir]   = useState('desc')
  const [page, setPage]         = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [toast, setToast]       = useState(null)

  const fetchReports = useCallback(() => {
    setLoading(true)
    api.get('/reports/visit-reports/')
      .then(r => setReports(r.data?.results || r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

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

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('desc')
    }
    setPage(1)
  }

  const sorted = [...reports].sort((a, b) => {
    const va = a[sortField] || ''
    const vb = b[sortField] || ''
    const cmp = va < vb ? -1 : va > vb ? 1 : 0
    return sortDir === 'asc' ? cmp : -cmp
  })

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const paginated  = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleExport = () => {
    const headers = ['Visit Number', 'Date', 'Type of Report', 'Company Name', 'Department', 'Author', 'Attendants', 'Subject', 'Agenda', 'Created At']
    const rows = sorted.map(r => [
      r.visit_number, r.date, r.type_of_report,
      r.company_name, r.department, r.author,
      r.attendants, r.subject, r.agenda,
      r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN') : '',
    ])
    const csv = [headers, ...rows].map(row => row.map(v => `"${v || ''}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = 'visit_reports_full.csv'
    a.click()
  }

  const SortTh = ({ field, label }) => {
    const active = sortField === field
    return (
      <th
        onClick={() => toggleSort(field)}
        style={{ ...th, cursor: 'pointer', userSelect: 'none' }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {label}
          <span style={{ opacity: active ? 1 : 0.35 }}>
            {active && sortDir === 'asc' ? '↑' : '↓'}
          </span>
        </span>
      </th>
    )
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
      `}</style>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            onClick={() => navigate(basePath)}
            style={{ width: 36, height: 36, borderRadius: 9, border: '1.5px solid #e5e7eb', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <Icon d={ic.arrowLeft} size={16} color="#6b7280" />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: PRIMARY }}>
              All Visit Reports
              <span style={{ fontSize: 15, fontWeight: 500, color: '#6b7280', marginLeft: 8 }}>({sorted.length})</span>
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#9ca3af', fontFamily: FONT }}>
              Sorted by {sortField === 'created_at' ? 'created date' : sortField} · {sortDir === 'desc' ? 'newest first' : 'oldest first'}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => window.print()} style={actionBtn}>
            <Icon d={ic.print} size={13} color="#475569" /> Print
          </button>
          <button onClick={handleExport} style={actionBtn}>
            <Icon d={ic.export} size={13} color="#475569" /> Export to Excel
          </button>
          <button onClick={() => setModalOpen(true)} style={primaryBtn}>
            <Icon d={ic.plus} size={14} color="#fff" /> New Report
          </button>
        </div>
      </div>

      {/* Search & filter */}
      <div style={{
        background: '#fff', borderRadius: 14,
        padding: '18px 22px', boxShadow: '0 2px 12px rgba(0,0,0,.06)',
        marginBottom: 20,
        display: 'grid', gridTemplateColumns: '1fr 200px auto', gap: 14, alignItems: 'center',
      }}>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <Icon d={ic.search} size={14} color="#9ca3af" />
          </span>
          <input
            style={{ ...searchInput, paddingLeft: 36 }}
            placeholder="Search by visit no / company / author…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <input type="date" style={searchInput} value={date} onChange={e => setDate(e.target.value)} />
        <button onClick={handleSearch} style={primaryBtn}>
          <Icon d={ic.search} size={13} color="#fff" /> Search
        </button>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,.06)', overflow: 'hidden', animation: 'fadeUp .3s ease' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 980, fontSize: 13.5 }}>
            <thead>
              <tr style={{ background: PRIMARY }}>
                <SortTh field="visit_number" label="Visit Number" />
                <SortTh field="date" label="Date" />
                <th style={th}>Type of Report</th>
                <SortTh field="company_name" label="Company Name" />
                <th style={th}>Department</th>
                <th style={th}>Author</th>
                <th style={th}>Attendants</th>
                <th style={th}>Subject</th>
                <th style={th}>Agenda</th>
                <SortTh field="created_at" label="Created At" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} style={{ padding: 44, textAlign: 'center', color: '#94a3b8' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    <div style={{ width: 18, height: 18, border: '2px solid #e2e8f0', borderTopColor: PRIMARY, borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
                    Loading reports…
                  </div>
                </td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={10} style={{ padding: 44, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
                  No visit reports match your filters.
                </td></tr>
              ) : paginated.map((r, i) => (
                <tr
                  key={r.id}
                  className="vr-row"
                  onClick={() => navigate(`${basePath}/${r.id}`)}
                  style={{ background: i % 2 === 0 ? '#fafafa' : '#fff', borderBottom: '1px solid #f1f5f9', transition: 'background .1s' }}
                >
                  <td style={{ ...td, color: PRIMARY, fontWeight: 700, fontFamily: 'monospace', fontSize: 12.5 }}>{r.visit_number}</td>
                  <td style={td}>{fmt(r.date)}</td>
                  <td style={td}>{r.type_of_report || '—'}</td>
                  <td style={{ ...td, fontWeight: 600, color: '#111827' }}>{r.company_name || '—'}</td>
                  <td style={td}>{r.department || '—'}</td>
                  <td style={td}>{r.author || '—'}</td>
                  <td style={{ ...td, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.attendants || '—'}</td>
                  <td style={{ ...td, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.subject || '—'}</td>
                  <td style={{ ...td, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#6b7280' }}>{r.agenda || '—'}</td>
                  <td style={{ ...td, color: '#9ca3af', fontSize: 12.5 }}>{fmt(r.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', borderTop: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: 13, color: '#6b7280', fontFamily: FONT }}>
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
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
                <Icon d={ic.chevRight} size={14} color={PRIMARY} />
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
  padding: '8px 14px', border: '1.5px solid #e5e7eb',
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