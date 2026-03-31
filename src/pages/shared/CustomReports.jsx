// src/pages/shared/CustomReports.jsx
// Works for both employee and manager roles — pass role as prop from router
// Route: /employee/reports/custom  and  /manager/reports/custom

import { useEffect, useState, useCallback, useRef } from 'react'
import api from '../../api/axios'
import banner from '../../assets/dashboard-banner.png'
import Toast from '../../components/Toast'

const PRIMARY = '#122C41'
const BORDER  = '#e2e8f0'
const FONT    = "'Inter', 'Segoe UI', sans-serif"

// ─── tiny helpers ─────────────────────────────────────────────────────────────
function fmt(n) { return new Intl.NumberFormat('en-IN').format(n ?? 0) }

function Spinner({ size = 16, color = PRIMARY }) {
  return (
    <>
      <style>{`@keyframes cr-spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{
        width: size, height: size,
        border: `2px solid #e5e7eb`,
        borderTopColor: color,
        borderRadius: '50%',
        animation: 'cr-spin 0.7s linear infinite',
        flexShrink: 0,
      }} />
    </>
  )
}

// ─── icons (inline svg paths) ────────────────────────────────────────────────
const ICONS = {
  table:    'M3 3h18v18H3zM3 9h18M3 15h18M9 3v18M15 3v18',
  filter:   'M22 3H2l8 9.46V19l4 2V12.46z',
  save:     'M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2zM17 21v-8H7v8M7 3v5h8',
  download: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3',
  trash:    'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6',
  copy:     'M20 9H11a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-9a2 2 0 00-2-2zM5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1',
  play:     'M5 3l14 9-14 9V3z',
  plus:     'M12 5v14M5 12h14',
  x:        'M18 6L6 18M6 6l12 12',
  chevron:  'M6 9l6 6 6-6',
  search:   'M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z',
  check:    'M20 6L9 17l-5-5',
  grip:     'M9 5h2M9 10h2M9 15h2M13 5h2M13 10h2M13 15h2',
  star:     'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  info:     'M12 16v-4M12 8h.01M22 12a10 10 0 11-20 0 10 10 0 0120 0z',
}

function Icon({ name, size = 14, stroke = 'currentColor', strokeWidth = 2, fill = 'none' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {ICONS[name].split('M').filter(Boolean).map((d, i) => (
        <path key={i} d={`M${d}`} />
      ))}
    </svg>
  )
}

// ─── Module colour map ────────────────────────────────────────────────────────
const MODULE_META = {
  enquiry:   { color: '#3b82f6', bg: '#eff6ff', label: 'Enquiries'               },
  customer:  { color: '#10b981', bg: '#f0fdf4', label: 'Customers'               },
  quotation: { color: '#f59e0b', bg: '#fffbeb', label: 'Quotations'              },
  oa:        { color: '#8b5cf6', bg: '#f5f3ff', label: 'Order Acknowledgements'  },
  proforma:  { color: '#ef4444', bg: '#fef2f2', label: 'Proforma Invoices'       },
}

const TYPE_OPERATOR_MAP = {
  str:      [{ v: 'eq', l: 'Equals' },      { v: 'neq', l: 'Not equals' }, { v: 'contains', l: 'Contains' }, { v: 'isnull', l: 'Is empty' }],
  int:      [{ v: 'eq', l: 'Equals' },      { v: 'gte', l: '≥' },          { v: 'lte', l: '≤' }],
  decimal:  [{ v: 'eq', l: 'Equals' },      { v: 'gte', l: '≥' },          { v: 'lte', l: '≤' }],
  date:     [{ v: 'eq', l: 'On' },          { v: 'gte', l: 'After' },      { v: 'lte', l: 'Before' }],
  datetime: [{ v: 'gte', l: 'After' },      { v: 'lte', l: 'Before' }],
  bool:     [{ v: 'eq', l: 'Is' }],
  choice:   [{ v: 'eq', l: 'Equals' },      { v: 'neq', l: 'Not equals' }, { v: 'in', l: 'Is one of' }],
}

// ─── SavedReport sidebar item ─────────────────────────────────────────────────
function SavedItem({ report, active, onRun, onDelete, onDuplicate }) {
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
          {report.name}
        </div>
        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
          {report.column_count} col · {report.created_by_name || 'Unknown'}
        </div>
      </div>

      <div ref={menuRef} style={{ position: 'relative', flexShrink: 0 }}>
        <button
          onClick={e => { e.stopPropagation(); setMenuOpen(o => !o) }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', borderRadius: 4, color: '#94a3b8', display: 'flex', alignItems: 'center' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" /></svg>
        </button>
        {menuOpen && (
          <div style={{
            position: 'absolute', right: 0, top: '100%', zIndex: 100,
            background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 8,
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)', padding: '4px 0', minWidth: 140,
          }}>
            {[
              { label: 'Duplicate', icon: 'copy', action: () => { onDuplicate(report); setMenuOpen(false) } },
              { label: 'Delete',    icon: 'trash', action: () => { onDelete(report.id); setMenuOpen(false) }, danger: true },
            ].map(item => (
              <button key={item.label} onClick={e => { e.stopPropagation(); item.action() }} style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                padding: '8px 14px', background: 'none', border: 'none',
                cursor: 'pointer', fontSize: 13, fontFamily: FONT,
                color: item.danger ? '#dc2626' : '#374151',
                transition: 'background 0.1s',
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

// ─── Column chip (draggable) ──────────────────────────────────────────────────
function ColumnChip({ col, modMeta, onRemove, dragHandleProps }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: modMeta.bg, border: `1px solid ${modMeta.color}30`,
      borderRadius: 20, padding: '4px 10px 4px 6px',
      fontSize: 12, color: modMeta.color, fontWeight: 500,
      cursor: 'grab', userSelect: 'none',
    }} {...dragHandleProps}>
      <span style={{ color: '#94a3b8', cursor: 'grab', display: 'flex', alignItems: 'center' }}><Icon name="grip" size={11} /></span>
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: modMeta.color, flexShrink: 0,
      }} />
      {col.label}
      <button onClick={onRemove} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: modMeta.color, opacity: 0.6, padding: 0,
        display: 'flex', alignItems: 'center', marginLeft: 2,
        transition: 'opacity 0.1s',
      }}
        onMouseEnter={e => e.currentTarget.style.opacity = '1'}
        onMouseLeave={e => e.currentTarget.style.opacity = '0.6'}
      >
        <Icon name="x" size={11} />
      </button>
    </div>
  )
}

// ─── Filter row ───────────────────────────────────────────────────────────────
function FilterRow({ filter, index, allFields, onChange, onRemove }) {
  const fieldDef = allFields.find(f => f.module === filter.module && f.key === filter.field)
  const operators = fieldDef ? (TYPE_OPERATOR_MAP[fieldDef.type] || TYPE_OPERATOR_MAP.str) : TYPE_OPERATOR_MAP.str
  const modMeta = MODULE_META[filter.module] || { color: PRIMARY, bg: '#f8fafc' }

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto',
      gap: 8, alignItems: 'center',
      padding: '8px 12px', background: '#fafcff',
      border: `1px solid ${BORDER}`, borderRadius: 8,
    }}>
      {/* Module */}
      <select
        value={filter.module}
        onChange={e => onChange(index, 'module', e.target.value)}
        style={selectStyle}
      >
        {Object.entries(MODULE_META).map(([k, v]) => (
          <option key={k} value={k}>{v.label}</option>
        ))}
      </select>

      {/* Field */}
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

      {/* Operator */}
      <select
        value={filter.operator}
        onChange={e => onChange(index, 'operator', e.target.value)}
        style={selectStyle}
      >
        {operators.map(op => (
          <option key={op.v} value={op.v}>{op.l}</option>
        ))}
      </select>

      {/* Value */}
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
        transition: 'all 0.15s',
      }}
        onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2' }}
        onMouseLeave={e => { e.currentTarget.style.background = '#fef2f2' }}
      >
        <Icon name="trash" size={13} />
      </button>
    </div>
  )
}

const selectStyle = {
  border: `1.5px solid ${BORDER}`, borderRadius: 7,
  padding: '8px 10px', fontSize: 12, fontFamily: FONT,
  background: '#fff', color: '#1e293b', outline: 'none',
  width: '100%', cursor: 'pointer', boxSizing: 'border-box',
}
const inputStyle = {
  border: `1.5px solid ${BORDER}`, borderRadius: 7,
  padding: '8px 10px', fontSize: 12, fontFamily: FONT,
  background: '#fff', color: '#1e293b', outline: 'none',
  width: '100%', boxSizing: 'border-box',
}

// ─── Save modal ───────────────────────────────────────────────────────────────
function SaveModal({ onSave, onClose, loading }) {
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [shared, setShared] = useState(true)

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, backdropFilter: 'blur(2px)',
    }}>
      <div style={{
        background: '#fff', borderRadius: 14, padding: '28px 32px',
        width: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 700, color: PRIMARY }}>Save Report</h3>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: '#64748b' }}>Give this report a name to save it for later use.</p>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Report Name *</label>
          <input
            autoFocus
            placeholder="e.g. Tier A Pipeline Q1"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && name.trim() && onSave({ name, description: desc, is_shared: shared })}
            style={{ ...inputStyle, fontSize: 13, padding: '10px 12px' }}
          />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Description (optional)</label>
          <textarea
            placeholder="What does this report show?"
            value={desc}
            onChange={e => setDesc(e.target.value)}
            rows={2}
            style={{ ...inputStyle, fontSize: 13, padding: '10px 12px', resize: 'vertical' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#374151', fontWeight: 500 }}>
            <input type="checkbox" checked={shared} onChange={e => setShared(e.target.checked)}
              style={{ width: 15, height: 15, accentColor: PRIMARY, cursor: 'pointer' }}
            />
            Share with team
          </label>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ ...btnOutline, padding: '9px 20px' }}>Cancel</button>
          <button
            onClick={() => name.trim() && onSave({ name, description: desc, is_shared: shared })}
            disabled={!name.trim() || loading}
            style={{ ...btnPrimary, padding: '9px 20px', opacity: (!name.trim() || loading) ? 0.6 : 1 }}
          >
            {loading ? <Spinner size={14} color="#fff" /> : <Icon name="save" size={14} />}
            Save Report
          </button>
        </div>
      </div>
    </div>
  )
}

const btnPrimary = {
  background: PRIMARY, color: '#fff', border: 'none',
  padding: '10px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
  cursor: 'pointer', fontFamily: FONT, display: 'inline-flex',
  alignItems: 'center', gap: 7, transition: 'background 0.15s', whiteSpace: 'nowrap',
}
const btnOutline = {
  border: `1.5px solid ${BORDER}`, background: '#fff', color: '#374151',
  padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
  cursor: 'pointer', fontFamily: FONT, display: 'inline-flex',
  alignItems: 'center', gap: 7, transition: 'all 0.15s', whiteSpace: 'nowrap',
}
const btnSuccess = {
  background: '#16a34a', color: '#fff', border: 'none',
  padding: '10px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
  cursor: 'pointer', fontFamily: FONT, display: 'inline-flex',
  alignItems: 'center', gap: 7, transition: 'background 0.15s', whiteSpace: 'nowrap',
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function CustomReports({ role = 'employee' }) {
  const [registry, setRegistry]           = useState(null)        // { modules, fields }
  const [savedReports, setSavedReports]   = useState([])
  const [activeReport, setActiveReport]   = useState(null)        // running saved report id
  const [loadingRegistry, setLoadingRegistry] = useState(true)

  // Builder state
  const [selectedModules, setSelectedModules] = useState(['enquiry'])
  const [selectedColumns, setSelectedColumns] = useState([])
  const [filters, setFilters]                 = useState([])
  const [orderBy, setOrderBy]                 = useState('-created_at')

  // Results state
  const [results, setResults]       = useState(null)              // { columns, rows, total, page, pages }
  const [currentPage, setCurrentPage] = useState(1)
  const [running, setRunning]       = useState(false)

  // UI state
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [saving, setSaving]               = useState(false)
  const [downloading, setDownloading]     = useState(false)
  const [toast, setToast]                 = useState(null)
  const [searchSaved, setSearchSaved]     = useState('')
  const [activeTab, setActiveTab]         = useState('builder')   // 'builder' | 'results'
  const [sidebarSection, setSidebarSection] = useState('saved')   // 'saved' | 'new'

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(null), 3500) }

  // ── Load registry + saved reports ──────────────────────────────────────────
  useEffect(() => {
    setLoadingRegistry(true)
    Promise.all([
      api.get('/custom-reports/fields/'),
      api.get('/custom-reports/saved/'),
    ]).then(([regRes, savedRes]) => {
      setRegistry(regRes.data)
      setSavedReports(savedRes.data?.results || savedRes.data || [])
    }).catch(console.error)
      .finally(() => setLoadingRegistry(false))
  }, [])

  // ── Flattened field list for filters ───────────────────────────────────────
  const allFields = registry
    ? Object.entries(registry.fields).flatMap(([mod, fields]) =>
        fields.map(f => ({ ...f, module: mod }))
      )
    : []

  // ── Available columns for selected modules ─────────────────────────────────
  const availableColumns = registry
    ? selectedModules.flatMap(mod =>
        (registry.fields[mod] || []).map(f => ({ ...f, module: mod }))
      )
    : []

  // ── Build config from builder state ────────────────────────────────────────
  const buildConfig = useCallback(() => ({
    modules:  selectedModules,
    columns:  selectedColumns,
    filters:  filters.filter(f => f.field && f.value !== '' && f.value !== undefined),
    order_by: orderBy,
  }), [selectedModules, selectedColumns, filters, orderBy])

  // ── Run report ─────────────────────────────────────────────────────────────
  const runReport = useCallback(async (configOverride = null, page = 1) => {
    const config = configOverride || buildConfig()
    if (!config.columns?.length) {
      showToast('Please select at least one column to run the report.')
      return
    }
    setRunning(true)
    setActiveTab('results')
    try {
      const res = await api.post('/custom-reports/run/', { config, page, page_size: 50 })
      setResults({ ...res.data, config })
      setCurrentPage(page)
    } catch (e) {
      showToast('Failed to run report. Please check your filters.')
    } finally {
      setRunning(false)
    }
  }, [buildConfig])

  // ── Run saved report ────────────────────────────────────────────────────────
  const runSaved = async (report) => {
    setActiveReport(report.id)
    // Load config into builder
    const cfg = report.config
    setSelectedModules(cfg.modules || ['enquiry'])
    setSelectedColumns(cfg.columns || [])
    setFilters(cfg.filters || [])
    setOrderBy(cfg.order_by || '-created_at')
    await runReport(cfg)
  }

  // ── Download Excel ─────────────────────────────────────────────────────────
  const downloadExcel = async () => {
    const config = buildConfig()
    if (!config.columns?.length) { showToast('Select at least one column first.'); return }
    setDownloading(true)
    try {
      const res = await api.post('/custom-reports/run/?format=xlsx', { config, page_size: 5000 }, { responseType: 'blob' })
      const url  = URL.createObjectURL(res.data)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `report_${new Date().toISOString().slice(0,10)}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
      showToast('Excel downloaded successfully.')
    } catch {
      showToast('Excel download failed. Try again.')
    } finally {
      setDownloading(false)
    }
  }

  // ── Save report ─────────────────────────────────────────────────────────────
  const saveReport = async ({ name, description, is_shared }) => {
    setSaving(true)
    try {
      const config = buildConfig()
      const res = await api.post('/custom-reports/saved/', { name, description, is_shared, config })
      setSavedReports(prev => [res.data, ...prev])
      setShowSaveModal(false)
      showToast(`Report "${name}" saved.`)
    } catch {
      showToast('Failed to save report.')
    } finally {
      setSaving(false)
    }
  }

  // ── Delete saved report ─────────────────────────────────────────────────────
  const deleteReport = async (id) => {
    if (!confirm('Delete this saved report?')) return
    try {
      await api.delete(`/custom-reports/saved/${id}/`)
      setSavedReports(prev => prev.filter(r => r.id !== id))
      if (activeReport === id) setActiveReport(null)
      showToast('Report deleted.')
    } catch {
      showToast('Failed to delete report.')
    }
  }

  // ── Duplicate saved report ──────────────────────────────────────────────────
  const duplicateReport = async (report) => {
    try {
      const res = await api.post(`/custom-reports/saved/${report.id}/duplicate/`, { name: `${report.name} (Copy)` })
      setSavedReports(prev => [res.data, ...prev])
      showToast(`Duplicated as "${res.data.name}".`)
    } catch {
      showToast('Failed to duplicate report.')
    }
  }

  // ── Column management ───────────────────────────────────────────────────────
  const toggleColumn = (mod, field, label) => {
    const key = `${mod}__${field}`
    const exists = selectedColumns.find(c => c.module === mod && c.field === field)
    if (exists) {
      setSelectedColumns(prev => prev.filter(c => !(c.module === mod && c.field === field)))
    } else {
      setSelectedColumns(prev => [...prev, { module: mod, field, label }])
    }
  }

  const removeColumn = (mod, field) => {
    setSelectedColumns(prev => prev.filter(c => !(c.module === mod && c.field === field)))
  }

  const isColSelected = (mod, field) => selectedColumns.some(c => c.module === mod && c.field === field)

  // ── Module toggle ───────────────────────────────────────────────────────────
  const toggleModule = (modKey) => {
    if (modKey === 'enquiry') return // always required
    setSelectedModules(prev => {
      if (prev.includes(modKey)) {
        // Remove module and its columns
        setSelectedColumns(cols => cols.filter(c => c.module !== modKey))
        return prev.filter(m => m !== modKey)
      }
      return [...prev, modKey]
    })
  }

  // ── Filter management ────────────────────────────────────────────────────────
  const addFilter = () => {
    setFilters(prev => [...prev, { module: 'enquiry', field: '', operator: 'eq', value: '' }])
  }
  const updateFilter = (idx, key, val) => {
    setFilters(prev => prev.map((f, i) => {
      if (i !== idx) return f
      const updated = { ...f, [key]: val }
      if (key === 'module') { updated.field = ''; updated.value = '' }
      if (key === 'field') { updated.value = ''; updated.operator = 'eq' }
      return updated
    }))
  }
  const removeFilter = idx => setFilters(prev => prev.filter((_, i) => i !== idx))

  // ── Filtered saved reports ──────────────────────────────────────────────────
  const filteredSaved = savedReports.filter(r =>
    !searchSaved || r.name.toLowerCase().includes(searchSaved.toLowerCase())
  )

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: FONT, background: '#f8fafc', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        @keyframes cr-spin { to { transform: rotate(360deg) } }
        @keyframes cr-fade { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:none } }

        .cr-col-check:hover { background: #f0f9ff !important; }
        .cr-row:hover td { background: #f8fafc !important; }
        .cr-tab { transition: all 0.15s; }
        .cr-tab:hover { background: #f1f5f9 !important; }
        .cr-tab-active { background: ${PRIMARY} !important; color: #fff !important; }
        .cr-mod-btn { transition: all 0.15s; cursor: pointer; }
        .cr-mod-btn:hover { transform: translateY(-1px); box-shadow: 0 3px 10px rgba(0,0,0,0.1); }
        .cr-save-btn:hover { background: #1a3f5c !important; }
        .cr-dl-btn:hover { background: #15803d !important; }
        .cr-run-btn:hover { background: #1a3f5c !important; }

        thead th {
          background: ${PRIMARY}; color: #e2e8f0;
          font-size: 11px; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.04em;
          padding: 11px 14px; text-align: left;
          white-space: nowrap; border-right: 1px solid rgba(255,255,255,0.07);
        }
        thead th:first-child { border-radius: 8px 0 0 0; }
        thead th:last-child  { border-radius: 0 8px 0 0; border-right: none; }
        tbody td {
          padding: 11px 14px; font-size: 12.5px; color: #374151;
          border-bottom: 1px solid #f1f5f9; white-space: nowrap;
          border-right: 1px solid #f5f7fa;
        }
        tbody td:last-child { border-right: none; }
        tbody tr:last-child td { border-bottom: none; }
      `}</style>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      {showSaveModal && <SaveModal onSave={saveReport} onClose={() => setShowSaveModal(false)} loading={saving} />}

      {/* ── BANNER ─────────────────────────────────────────────────────────── */}
      <div style={{
        backgroundImage: `url(${banner})`, backgroundSize: 'cover', backgroundPosition: 'center',
        borderRadius: 16, padding: '28px 32px 32px', position: 'relative', marginBottom: 24,
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(120deg,rgba(18,44,65,.8),rgba(18,44,65,.45))', borderRadius: 16 }} />
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ color: '#fff', fontSize: 26, margin: '0 0 4px', fontWeight: 700, letterSpacing: '-0.3px' }}>
              Custom Reports
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.55)', margin: 0, fontSize: 13 }}>
              Build, save, and export custom reports across all modules
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => { setActiveReport(null); setSelectedColumns([]); setFilters([]); setResults(null); setActiveTab('builder') }}
              style={{ ...btnOutline, background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.3)' }}
            >
              <Icon name="plus" size={14} /> New Report
            </button>
          </div>
        </div>
      </div>

      {/* ── MAIN LAYOUT ───────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20 }}>

        {/* LEFT SIDEBAR ──────────────────────────────────────────────────── */}
        <div style={{
          background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 14,
          boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
          display: 'flex', flexDirection: 'column', minHeight: 600, overflow: 'hidden',
        }}>
          {/* Sidebar header */}
          <div style={{ padding: '16px 16px 12px', borderBottom: `1px solid ${BORDER}` }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: PRIMARY, marginBottom: 10 }}>Saved Reports</div>
            <div style={{ position: 'relative' }}>
              <Icon name="search" size={13} stroke="#94a3b8" />
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

          {/* Saved list */}
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
                <SavedItem
                  key={report.id}
                  report={report}
                  active={activeReport === report.id}
                  onRun={runSaved}
                  onDelete={deleteReport}
                  onDuplicate={duplicateReport}
                />
              ))
            )}
          </div>

          {/* Count */}
          <div style={{ padding: '10px 16px', borderTop: `1px solid ${BORDER}`, fontSize: 11, color: '#94a3b8' }}>
            {savedReports.length} saved report{savedReports.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* RIGHT PANEL ────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 10, padding: 4, width: 'fit-content', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            {[{ key: 'builder', label: 'Builder', icon: 'filter' }, { key: 'results', label: 'Results', icon: 'table' }].map(tab => (
              <button key={tab.key}
                className={`cr-tab${activeTab === tab.key ? ' cr-tab-active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '7px 18px', border: 'none', borderRadius: 7, cursor: 'pointer',
                  fontSize: 13, fontWeight: 600, fontFamily: FONT,
                  background: activeTab === tab.key ? PRIMARY : 'transparent',
                  color: activeTab === tab.key ? '#fff' : '#64748b',
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                }}
              >
                <Icon name={tab.icon} size={13} />
                {tab.label}
                {tab.key === 'results' && results && (
                  <span style={{
                    background: activeTab === 'results' ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                    color: activeTab === 'results' ? '#fff' : '#475569',
                    borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 700,
                  }}>
                    {fmt(results.total)}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── BUILDER TAB ─────────────────────────────────────────────── */}
          {activeTab === 'builder' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, animation: 'cr-fade 0.2s ease' }}>

              {/* Step 1 — Modules */}
              <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 12, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: PRIMARY, color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>1</div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: PRIMARY }}>Select Modules</span>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>— Choose which data to include</span>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {loadingRegistry ? <Spinner /> : registry?.modules.map(mod => {
                    const meta = MODULE_META[mod.key] || { color: PRIMARY, bg: '#f8fafc', label: mod.label }
                    const selected = selectedModules.includes(mod.key)
                    const locked = mod.key === 'enquiry'
                    return (
                      <button key={mod.key}
                        className="cr-mod-btn"
                        onClick={() => !locked && toggleModule(mod.key)}
                        style={{
                          padding: '8px 16px', borderRadius: 20, fontFamily: FONT, fontSize: 13, fontWeight: 600,
                          border: `1.5px solid ${selected ? meta.color : BORDER}`,
                          background: selected ? meta.bg : '#fff',
                          color: selected ? meta.color : '#64748b',
                          cursor: locked ? 'default' : 'pointer',
                          display: 'inline-flex', alignItems: 'center', gap: 7,
                          opacity: locked ? 1 : 1,
                          boxShadow: selected ? `0 0 0 3px ${meta.color}18` : 'none',
                        }}
                      >
                        {selected && <Icon name="check" size={12} stroke={meta.color} strokeWidth={2.5} />}
                        {mod.label}
                        {locked && <span style={{ fontSize: 10, opacity: 0.6, fontWeight: 400 }}>(required)</span>}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Step 2 — Columns */}
              <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 12, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: PRIMARY, color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>2</div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: PRIMARY }}>Pick Columns</span>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>— Select what to display</span>
                  </div>
                  {selectedColumns.length > 0 && (
                    <button onClick={() => setSelectedColumns([])} style={{ fontSize: 12, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT }}>
                      Clear all
                    </button>
                  )}
                </div>

                {/* Selected columns chips */}
                {selectedColumns.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14, padding: '10px 12px', background: '#f8fafc', borderRadius: 8, border: `1px solid ${BORDER}` }}>
                    {selectedColumns.map((col, idx) => {
                      const meta = MODULE_META[col.module] || { color: PRIMARY, bg: '#f8fafc' }
                      return (
                        <ColumnChip key={`${col.module}__${col.field}`} col={col} modMeta={meta}
                          onRemove={() => removeColumn(col.module, col.field)}
                          dragHandleProps={{}}
                        />
                      )
                    })}
                  </div>
                )}

                {/* Column picker by module */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {selectedModules.map(modKey => {
                    const meta = MODULE_META[modKey] || { color: PRIMARY, bg: '#f8fafc', label: modKey }
                    const fields = registry?.fields[modKey] || []
                    return (
                      <div key={modKey}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: meta.color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: meta.color, display: 'inline-block' }} />
                          {meta.label}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {fields.map(f => {
                            const selected = isColSelected(modKey, f.key)
                            return (
                              <button key={f.key}
                                className="cr-col-check"
                                onClick={() => toggleColumn(modKey, f.key, f.label)}
                                style={{
                                  padding: '5px 11px', borderRadius: 16, fontFamily: FONT, fontSize: 12,
                                  border: `1px solid ${selected ? meta.color : BORDER}`,
                                  background: selected ? meta.bg : '#fff',
                                  color: selected ? meta.color : '#64748b',
                                  cursor: 'pointer', fontWeight: selected ? 600 : 400,
                                  display: 'inline-flex', alignItems: 'center', gap: 5,
                                  transition: 'all 0.12s',
                                }}
                              >
                                {selected && <Icon name="check" size={11} stroke={meta.color} strokeWidth={2.5} />}
                                {f.label}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Step 3 — Filters */}
              <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 12, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: PRIMARY, color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>3</div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: PRIMARY }}>Add Filters</span>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>— Narrow down results (optional)</span>
                  </div>
                  <button onClick={addFilter} style={{ ...btnOutline, padding: '6px 14px', fontSize: 12 }}>
                    <Icon name="plus" size={12} /> Add Filter
                  </button>
                </div>

                {filters.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '18px 0', color: '#94a3b8', fontSize: 13 }}>
                    No filters added — all records will be included.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {filters.map((f, idx) => (
                      <FilterRow key={idx} filter={f} index={idx} allFields={allFields}
                        onChange={updateFilter} onRemove={removeFilter}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Step 4 — Sort + Run */}
              <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: PRIMARY, color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>4</div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: PRIMARY }}>Sort by</span>
                  </div>
                  <select value={orderBy} onChange={e => setOrderBy(e.target.value)} style={{ ...selectStyle, width: 220 }}>
                    <option value="-created_at">Newest first</option>
                    <option value="created_at">Oldest first</option>
                    <option value="-prospective_value">Value (high → low)</option>
                    <option value="prospective_value">Value (low → high)</option>
                    <option value="company_name">Company name A–Z</option>
                    <option value="enquiry_number">Enquiry number</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => setShowSaveModal(true)}
                    style={{ ...btnOutline }}
                    disabled={!selectedColumns.length}
                  >
                    <Icon name="save" size={14} /> Save Report
                  </button>
                  <button
                    className="cr-run-btn"
                    onClick={() => runReport()}
                    disabled={running || !selectedColumns.length}
                    style={{ ...btnPrimary, opacity: (!selectedColumns.length || running) ? 0.6 : 1 }}
                  >
                    {running ? <Spinner size={14} color="#fff" /> : <Icon name="play" size={14} />}
                    Run Report
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── RESULTS TAB ─────────────────────────────────────────────── */}
          {activeTab === 'results' && (
            <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.05)', animation: 'cr-fade 0.2s ease', overflow: 'hidden' }}>

              {/* Results header */}
              <div style={{ padding: '16px 20px', borderBottom: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: PRIMARY }}>
                    {running ? 'Running…' : results ? `${fmt(results.total)} Results` : 'No results yet'}
                  </h3>
                  {results && !running && (
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>
                      Page {currentPage} of {results.pages}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setActiveTab('builder')} style={{ ...btnOutline, padding: '7px 14px', fontSize: 12 }}>
                    <Icon name="filter" size={12} /> Edit Builder
                  </button>
                  <button
                    className="cr-dl-btn"
                    onClick={downloadExcel}
                    disabled={!results || downloading || running}
                    style={{ ...btnSuccess, opacity: (!results || downloading || running) ? 0.6 : 1 }}
                  >
                    {downloading ? <Spinner size={13} color="#fff" /> : <Icon name="download" size={13} />}
                    Download Excel
                  </button>
                </div>
              </div>

              {/* Table */}
              {running ? (
                <div style={{ padding: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, color: '#94a3b8' }}>
                  <Spinner size={28} />
                  <span style={{ fontSize: 14 }}>Fetching your report…</span>
                </div>
              ) : !results ? (
                <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>📊</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>No results yet</div>
                  <div style={{ fontSize: 13 }}>Configure your report in the Builder tab and click Run Report.</div>
                  <button onClick={() => setActiveTab('builder')} style={{ ...btnPrimary, margin: '16px auto 0', padding: '9px 20px', fontSize: 12 }}>
                    <Icon name="filter" size={13} /> Go to Builder
                  </button>
                </div>
              ) : results.rows.length === 0 ? (
                <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>🔍</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>No records found</div>
                  <div style={{ fontSize: 13 }}>Try adjusting your filters or selecting different modules.</div>
                </div>
              ) : (
                <>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr>
                          <th style={{ width: 44 }}>#</th>
                          {results.columns.map(col => (
                            <th key={col.key}>{col.label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {results.rows.map((row, rIdx) => (
                          <tr key={rIdx} className="cr-row">
                            <td style={{ color: '#94a3b8', fontSize: 11, textAlign: 'center' }}>
                              {(currentPage - 1) * 50 + rIdx + 1}
                            </td>
                            {results.columns.map(col => {
                              const val = row[col.key]
                              return (
                                <td key={col.key} style={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {val === null || val === undefined
                                    ? <span style={{ color: '#cbd5e1' }}>—</span>
                                    : typeof val === 'boolean'
                                    ? <span style={{ color: val ? '#16a34a' : '#dc2626', fontWeight: 600, fontSize: 11 }}>{val ? 'Yes' : 'No'}</span>
                                    : typeof val === 'number'
                                    ? <span style={{ fontWeight: 500 }}>{val.toLocaleString('en-IN')}</span>
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

                  {/* Pagination */}
                  {results.pages > 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: `1px solid ${BORDER}` }}>
                      <span style={{ fontSize: 12, color: '#64748b' }}>
                        Showing {((currentPage - 1) * 50) + 1}–{Math.min(currentPage * 50, results.total)} of {fmt(results.total)}
                      </span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => { const p = currentPage - 1; setCurrentPage(p); runReport(results.config, p) }}
                          disabled={currentPage <= 1}
                          style={{ ...btnOutline, padding: '6px 14px', fontSize: 12, opacity: currentPage <= 1 ? 0.4 : 1 }}
                        >
                          ← Prev
                        </button>
                        {Array.from({ length: Math.min(results.pages, 5) }, (_, i) => {
                          const p = i + Math.max(1, currentPage - 2)
                          if (p > results.pages) return null
                          return (
                            <button key={p} onClick={() => { setCurrentPage(p); runReport(results.config, p) }}
                              style={{
                                ...btnOutline, padding: '6px 12px', fontSize: 12,
                                background: p === currentPage ? PRIMARY : '#fff',
                                color: p === currentPage ? '#fff' : '#374151',
                                borderColor: p === currentPage ? PRIMARY : BORDER,
                              }}
                            >{p}</button>
                          )
                        })}
                        <button
                          onClick={() => { const p = currentPage + 1; setCurrentPage(p); runReport(results.config, p) }}
                          disabled={!results.has_next}
                          style={{ ...btnOutline, padding: '6px 14px', fontSize: 12, opacity: !results.has_next ? 0.4 : 1 }}
                        >
                          Next →
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}