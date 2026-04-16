// src/components/reports/ColumnChip.jsx
import Icon from './Icon'

export default function ColumnChip({ col, modMeta, onRemove }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: modMeta.bg, border: `1px solid ${modMeta.color}30`,
      borderRadius: 20, padding: '4px 10px 4px 6px',
      fontSize: 12, color: modMeta.color, fontWeight: 500,
      userSelect: 'none',
    }}>
      <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
        <Icon name="grip" size={11} />
      </span>
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: modMeta.color, flexShrink: 0,
      }} />
      {col.label}
      <button onClick={onRemove} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: modMeta.color, opacity: 0.6, padding: 0,
        display: 'flex', alignItems: 'center', marginLeft: 2,
      }}
        onMouseEnter={e => e.currentTarget.style.opacity = '1'}
        onMouseLeave={e => e.currentTarget.style.opacity = '0.6'}
      >
        <Icon name="x" size={11} />
      </button>
    </div>
  )
}