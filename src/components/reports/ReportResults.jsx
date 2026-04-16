// ReportResults.jsx - Fixed horizontal scroll (table only, not whole page)

import { BORDER, PRIMARY, btnOutline, btnSuccess, fmt, FONT } from './reportConstants'
import Icon from './Icon'
import Spinner from './Spinner'

export default function ReportResults({
  results,
  running,
  currentPage,
  setCurrentPage,
  runReport,
  downloadExcel,
  setActiveTab,
  downloading,
  onPrintPDF
}) {
  if (running) {
    return (
      <div style={{
        background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 16,
        padding: 80, display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 16, color: '#64748b', boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
      }}>
        <Spinner size={32} />
        <span style={{ fontSize: 15, fontWeight: 500 }}>Generating your report…</span>
        <span style={{ fontSize: 13, maxWidth: 240, textAlign: 'center' }}>
          This may take a few seconds depending on the data size
        </span>
      </div>
    )
  }

  if (!results) {
    return (
      <div style={{
        background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 16,
        padding: 80, textAlign: 'center', color: '#94a3b8', boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
      }}>
        <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.6 }}>📊</div>
        <div style={{ fontSize: 18, fontWeight: 600, color: '#334155', marginBottom: 8 }}>Your report is ready to build</div>
        <div style={{ fontSize: 14, maxWidth: 320, margin: '0 auto' }}>
          Go to the <strong>Builder</strong> tab, select modules &amp; columns, then click <strong>Run Report</strong>
        </div>
        <button
          onClick={() => setActiveTab('builder')}
          style={{
            ...btnOutline, marginTop: 24, padding: '12px 28px', fontSize: 14,
            background: PRIMARY, color: '#fff', border: 'none', boxShadow: '0 4px 12px rgba(18,44,65,0.2)'
          }}
        >
          <Icon name="filter" size={16} /> Open Builder
        </button>
      </div>
    )
  }

  if (results.rows.length === 0) {
    return (
      <div style={{
        background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 16,
        padding: 80, textAlign: 'center', color: '#94a3b8', boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <div style={{ fontSize: 18, fontWeight: 600, color: '#334155', marginBottom: 8 }}>No matching records</div>
        <div style={{ fontSize: 14 }}>Try changing filters or selecting different columns</div>
      </div>
    )
  }

  return (
    <div style={{
      background: '#fff',
      border: `1px solid ${BORDER}`,
      borderRadius: 16,
      boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
      // KEY FIX: contain the component so it never causes page-level overflow
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      // Fills available vertical space but won't overflow horizontally
      minWidth: 0,
      width: '100%',
    }}>

      {/* Action Bar — always visible, never scrolls away */}
      <div style={{
        borderBottom: `1px solid ${BORDER}`,
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 10,
        flexShrink: 0,   // never shrink, always visible
        background: '#fff',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h3 style={{
            margin: 0, fontSize: 17, fontWeight: 700, color: PRIMARY,
            letterSpacing: '-0.3px'
          }}>
            {fmt(results.total)} results
          </h3>
          <span style={{
            fontSize: 13, background: '#f1f5f9', color: '#64748b',
            padding: '2px 10px', borderRadius: 9999, fontWeight: 500
          }}>
            Page {currentPage} • {results.columns.length} columns
          </span>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={() => setActiveTab('builder')}
            style={{ ...btnOutline, padding: '8px 14px', fontSize: 13 }}
          >
            <Icon name="filter" size={14} /> Edit Builder
          </button>

          <button
            onClick={downloadExcel}
            disabled={downloading}
            style={{
              ...btnSuccess, padding: '8px 14px', fontSize: 13,
              opacity: downloading ? 0.7 : 1
            }}
          >
            {downloading ? <Spinner size={14} color="#fff" /> : <Icon name="download" size={14} />}
            Download Excel
          </button>

          {onPrintPDF && (
            <button
              onClick={onPrintPDF}
              style={{
                padding: '8px 14px', fontSize: 13,
                background: '#f1f5f9', border: `1px solid ${BORDER}`,
                borderRadius: 8, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontWeight: 500, color: '#374151', fontFamily: FONT,
                whiteSpace: 'nowrap',
              }}
            >
              <Icon name="print" size={14} /> Print / PDF
            </button>
          )}
        </div>
      </div>

      {/* 
        KEY FIX: This wrapper is what scrolls — both horizontally and vertically.
        The parent card has overflow:hidden, so only THIS div scrolls,
        never the whole page.
      */}
      <div style={{
        overflowX: 'auto',      // horizontal scroll here only
        overflowY: 'auto',      // vertical scroll here only
        flex: 1,
        maxHeight: 'calc(100vh - 300px)',
        // Custom scrollbar styling for a cleaner look
        scrollbarWidth: 'thin',
        scrollbarColor: '#cbd5e1 transparent',
      }}>
        <table style={{
          width: 'max-content',   // KEY: let table be as wide as it needs
          minWidth: '100%',       // but at least fill the container
          borderCollapse: 'collapse',
          fontSize: 13.5,
        }}>
          <thead>
            <tr>
              <th style={{
                width: 48,
                position: 'sticky', left: 0, top: 0,
                background: PRIMARY,
                zIndex: 20,      // above both row and column stickiness
                color: '#e2e8f0', fontSize: 11, fontWeight: 600,
                textTransform: 'uppercase', padding: '14px 12px',
                borderRight: '1px solid rgba(255,255,255,0.1)',
                textAlign: 'left',
              }}>
                #
              </th>
              {results.columns.map((col, idx) => (
                <th
                  key={col.key}
                  style={{
                    position: 'sticky', top: 0,
                    background: PRIMARY,
                    zIndex: 10,
                    color: '#e2e8f0',
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    padding: '14px 16px',
                    whiteSpace: 'nowrap',
                    textAlign: 'left',
                    borderRight: idx < results.columns.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                  }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.rows.map((row, rIdx) => (
              <tr key={rIdx}>
                <td style={{
                  position: 'sticky', left: 0,
                  background: rIdx % 2 === 0 ? '#fff' : '#fafcff',
                  zIndex: 5,
                  color: '#94a3b8', fontSize: 12, fontWeight: 500, textAlign: 'center',
                  padding: '13px 12px', borderBottom: `1px solid ${BORDER}`,
                  borderRight: '1px solid #f1f5f9',
                }}>
                  {(currentPage - 1) * 50 + rIdx + 1}
                </td>
                {results.columns.map((col, colIdx) => {
                  const val = row[col.key]
                  return (
                    <td
                      key={col.key}
                      style={{
                        padding: '13px 16px',
                        borderBottom: `1px solid ${BORDER}`,
                        maxWidth: 280,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontSize: 13.5,
                        color: '#1e293b',
                        background: rIdx % 2 === 0 ? '#fff' : '#fafcff',
                      }}
                    >
                      {val === null || val === undefined
                        ? <span style={{ color: '#cbd5e1' }}>—</span>
                        : typeof val === 'boolean'
                        ? <span style={{
                            color: val ? '#16a34a' : '#dc2626',
                            fontWeight: 600, fontSize: 13
                          }}>
                            {val ? 'Yes' : 'No'}
                          </span>
                        : typeof val === 'number'
                        ? <span style={{ fontWeight: 500 }}>₹{val.toLocaleString('en-IN')}</span>
                        : String(val)
                      }
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination — always at bottom, never scrolls away */}
      {results.pages > 1 && (
        <div style={{
          padding: '14px 20px', borderTop: `1px solid ${BORDER}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#fff', flexWrap: 'wrap', gap: 10, fontSize: 13,
          flexShrink: 0,
        }}>
          <span style={{ color: '#64748b' }}>
            Showing {(currentPage - 1) * 50 + 1}–{Math.min(currentPage * 50, results.total)} of {fmt(results.total)}
          </span>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button
              onClick={() => { const p = currentPage - 1; setCurrentPage(p); runReport(results.config, p) }}
              disabled={currentPage <= 1}
              style={{ ...btnOutline, padding: '7px 16px', fontSize: 13, opacity: currentPage <= 1 ? 0.4 : 1 }}
            >
              ← Previous
            </button>

            {Array.from({ length: Math.min(results.pages, 5) }, (_, i) => {
              const p = i + Math.max(1, currentPage - 2)
              if (p > results.pages) return null
              return (
                <button
                  key={p}
                  onClick={() => { setCurrentPage(p); runReport(results.config, p) }}
                  style={{
                    ...btnOutline, padding: '7px 14px', fontSize: 13,
                    background: p === currentPage ? PRIMARY : '#fff',
                    color: p === currentPage ? '#fff' : '#374151',
                    borderColor: p === currentPage ? PRIMARY : BORDER,
                  }}
                >
                  {p}
                </button>
              )
            })}

            <button
              onClick={() => { const p = currentPage + 1; setCurrentPage(p); runReport(results.config, p) }}
              disabled={!results.has_next}
              style={{ ...btnOutline, padding: '7px 16px', fontSize: 13, opacity: !results.has_next ? 0.4 : 1 }}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      <style>{`
        tr:hover td {
          background: #f0f6ff !important;
        }
        thead th {
          text-align: left;
        }
      `}</style>
    </div>
  )
}