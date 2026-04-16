// src/components/reports/SavedReportItem.jsx
import { useState, useEffect, useRef } from 'react'
import { PRIMARY, BORDER, FONT } from './reportConstants'
import Icon from './Icon'

export default function SavedReportItem({ report, active, onRun, onDelete, onDuplicate }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    function close(e) { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '9px 12px', borderRadius: 8, cursor: 'pointer',
      background: active ? '#e8f0f8' : 'transparent',
      border: active ? `1px solid #c3d9f0` : '1px solid transparent',
      transition: 'all 0.15s',
      gap: 8,
    }}
      onClick={() => onRun(report)}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#f8fafc' }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: active ? PRIMARY : '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {report?.name || 'Unnamed Report'}
        </div>
        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
          {report?.column_count || 0} col · {report?.created_by_name || 'Unknown'}
        </div>
      </div>

      <div ref={menuRef} style={{ position: 'relative', flexShrink: 0 }}>
        <button
          onClick={e => { e.stopPropagation(); setMenuOpen(o => !o) }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', borderRadius: 4, color: '#94a3b8', display: 'flex', alignItems: 'center' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
          </svg>
        </button>
        {menuOpen && (
          <div style={{
            position: 'absolute', right: 0, top: '100%', zIndex: 100,
            background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 8,
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)', padding: '4px 0', minWidth: 140,
          }}>
            {[
              { label: 'Duplicate', icon: 'copy', action: () => { onDuplicate(report); setMenuOpen(false) } },
              { label: 'Delete', icon: 'trash', action: () => { onDelete(report.id); setMenuOpen(false) }, danger: true },
            ].map(item => (
              <button key={item.label} onClick={e => { e.stopPropagation(); item.action() }} style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                padding: '8px 14px', background: 'none', border: 'none',
                cursor: 'pointer', fontSize: 13, fontFamily: FONT,
                color: item.danger ? '#dc2626' : '#374151',
              }}
                onMouseEnter={e => e.currentTarget.style.background = item.danger ? '#fef2f2' : '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <Icon name={item.icon} size={13} />
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}