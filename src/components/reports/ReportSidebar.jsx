// src/components/reports/ReportSidebar.jsx
import { useState } from 'react'
import { BORDER, PRIMARY, inputStyle, FONT } from './reportConstants'
import Icon from './Icon'
import Spinner from './Spinner'
import SavedReportItem from './SavedReportItem'

export default function ReportSidebar({ 
  savedReports, 
  loadingRegistry, 
  activeReport, 
  onRunSaved, 
  onDeleteReport, 
  onDuplicateReport,
  searchSaved,
  setSearchSaved
}) {
  const filteredSaved = savedReports.filter(r =>
    !searchSaved || r.name.toLowerCase().includes(searchSaved.toLowerCase())
  )

  return (
    <div style={{
      background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 14,
      boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
      display: 'flex', flexDirection: 'column', minHeight: 600, overflow: 'hidden',
    }}>
      <div style={{ padding: '16px 16px 12px', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: PRIMARY, marginBottom: 10 }}>Saved Reports</div>
        <div style={{ position: 'relative' }}>
          <input
            placeholder="Search reports…"
            value={searchSaved}
            onChange={e => setSearchSaved(e.target.value)}
            style={{
              ...inputStyle, paddingLeft: 28, fontSize: 12,
              position: 'relative',
            }}
          />
          <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex' }}>
            <Icon name="search" size={12} stroke="#94a3b8" />
          </span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {loadingRegistry ? (
          <div style={{ padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#94a3b8', fontSize: 13 }}>
            <Spinner size={14} /> Loading…
          </div>
        ) : filteredSaved.length === 0 ? (
          <div style={{ padding: '24px 12px', textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
            {searchSaved ? 'No matching reports' : 'No saved reports yet.\nBuild your first one →'}
          </div>
        ) : (
          filteredSaved.map(report => (
            <SavedReportItem
              key={report.id}
              report={report}
              active={activeReport === report.id}
              onRun={onRunSaved}
              onDelete={onDeleteReport}
              onDuplicate={onDuplicateReport}
            />
          ))
        )}
      </div>

      <div style={{ padding: '10px 16px', borderTop: `1px solid ${BORDER}`, fontSize: 11, color: '#94a3b8' }}>
        {savedReports.length} saved report{savedReports.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}