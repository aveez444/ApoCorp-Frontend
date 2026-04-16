// src/components/reports/ReportBuilder.jsx
import { MODULE_META, selectStyle, btnPrimary, btnOutline, BORDER, PRIMARY, FONT } from './reportConstants'
import Icon from './Icon'
import Spinner from './Spinner'
import ColumnChip from './ColumnChip'
import FilterRow from './FilterRow'

export default function ReportBuilder({
  loadingRegistry,
  registry,
  selectedModules,
  toggleModule,
  selectedColumns,
  setSelectedColumns,
  removeColumn,
  isColSelected,
  toggleColumn,  // ADD THIS - receive toggleColumn from parent
  filters,
  addFilter,
  updateFilter,
  removeFilter,
  allFields,
  orderBy,
  setOrderBy,
  runReport,
  setShowSaveModal,
  running,
  selectedColumnsLength
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, animation: 'cr-fade 0.2s ease' }}>
      <style>{`
        @keyframes cr-fade { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:none } }
        .cr-mod-btn { transition: all 0.15s; cursor: pointer; }
        .cr-mod-btn:hover { transform: translateY(-1px); box-shadow: 0 3px 10px rgba(0,0,0,0.1); }
        .cr-col-check:hover { background: #f0f9ff !important; }
      `}</style>

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

        {selectedColumns.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14, padding: '10px 12px', background: '#f8fafc', borderRadius: 8, border: `1px solid ${BORDER}` }}>
            {selectedColumns.map((col, idx) => {
              const meta = MODULE_META[col.module] || { color: PRIMARY, bg: '#f8fafc' }
              return (
                <ColumnChip key={`${col.module}__${col.field}`} col={col} modMeta={meta}
                  onRemove={() => removeColumn(col.module, col.field)}
                />
              )
            })}
          </div>
        )}

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
                        onClick={() => toggleColumn(modKey, f.key, f.label)}  // Now toggleColumn is defined
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
      <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
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
            disabled={!selectedColumnsLength}
          >
            <Icon name="save" size={14} /> Save Report
          </button>
          <button
            className="cr-run-btn"
            onClick={() => runReport()}
            disabled={running || !selectedColumnsLength}
            style={{ ...btnPrimary, opacity: (!selectedColumnsLength || running) ? 0.6 : 1 }}
          >
            {running ? <Spinner size={14} color="#fff" /> : <Icon name="play" size={14} />}
            Run Report
          </button>
        </div>
      </div>
    </div>
  )
}