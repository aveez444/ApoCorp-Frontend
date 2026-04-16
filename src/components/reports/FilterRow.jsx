// src/components/reports/FilterRow.jsx
import { MODULE_META, TYPE_OPERATOR_MAP, selectStyle, inputStyle, FONT, BORDER } from './reportConstants'
import Icon from './Icon'

export default function FilterRow({ filter, index, allFields, onChange, onRemove }) {
  const fieldDef = allFields.find(f => f.module === filter.module && f.key === filter.field)
  const operators = fieldDef ? (TYPE_OPERATOR_MAP[fieldDef.type] || TYPE_OPERATOR_MAP.str) : TYPE_OPERATOR_MAP.str
  const modMeta = MODULE_META[filter.module] || { color: '#122C41', bg: '#f8fafc' }

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto',
      gap: 8, alignItems: 'center',
      padding: '8px 12px', background: '#fafcff',
      border: `1px solid ${BORDER}`, borderRadius: 8,
    }}>
      <select
        value={filter.module}
        onChange={e => onChange(index, 'module', e.target.value)}
        style={selectStyle}
      >
        {Object.entries(MODULE_META).map(([k, v]) => (
          <option key={k} value={k}>{v.label}</option>
        ))}
      </select>

      <select
        value={filter.field}
        onChange={e => onChange(index, 'field', e.target.value)}
        style={selectStyle}
      >
        <option value="">Select field…</option>
        {allFields.filter(f => f.module === filter.module && f.filterable).map(f => (
          <option key={f.key} value={f.key}>{f.label}</option>
        ))}
      </select>

      <select
        value={filter.operator}
        onChange={e => onChange(index, 'operator', e.target.value)}
        style={selectStyle}
      >
        {operators.map(op => (
          <option key={op.v} value={op.v}>{op.l}</option>
        ))}
      </select>

      {fieldDef?.type === 'choice' && filter.operator === 'in' ? (
        <select multiple value={Array.isArray(filter.value) ? filter.value : [filter.value]}
          onChange={e => onChange(index, 'value', Array.from(e.target.selectedOptions).map(o => o.value))}
          style={{ ...selectStyle, height: 64 }}
        >
          {fieldDef.choices.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      ) : fieldDef?.type === 'choice' ? (
        <select value={filter.value} onChange={e => onChange(index, 'value', e.target.value)} style={selectStyle}>
          <option value="">Select…</option>
          {fieldDef.choices.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      ) : fieldDef?.type === 'bool' ? (
        <select value={filter.value} onChange={e => onChange(index, 'value', e.target.value === 'true')} style={selectStyle}>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      ) : fieldDef?.type === 'date' || fieldDef?.type === 'datetime' ? (
        <input type="date" value={filter.value || ''} onChange={e => onChange(index, 'value', e.target.value)} style={inputStyle} />
      ) : (
        <input
          placeholder="Value…"
          value={filter.value || ''}
          onChange={e => onChange(index, 'value', e.target.value)}
          style={inputStyle}
        />
      )}

      <button onClick={() => onRemove(index)} style={{
        background: '#fef2f2', border: '1px solid #fecaca',
        borderRadius: 6, padding: '6px 8px', cursor: 'pointer',
        color: '#dc2626', display: 'flex', alignItems: 'center',
      }}>
        <Icon name="trash" size={13} />
      </button>
    </div>
  )
}