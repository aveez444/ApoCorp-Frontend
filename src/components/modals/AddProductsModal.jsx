/**
 * AddProductsModal.jsx
 *
 * A wide two-panel modal for picking products from the DB and building
 * quotation line items.
 *
 * Props:
 *   open          {boolean}
 *   onClose       {() => void}
 *   initialItems  {LineItem[]}          — existing line items to pre-populate
 *   onSave        {(items: LineItem[]) => void}
 *   currency      {string}              — e.g. "INR"
 *
 * Usage in CreateQuoteModal (replace the old ProductModal trigger):
 *   import AddProductsModal from './AddProductsModal'
 *   ...
 *   <AddProductsModal
 *     open={showProductModal}
 *     onClose={() => setShowProductModal(false)}
 *     initialItems={lineItems}
 *     onSave={items => { setLineItems(items); setShowProductModal(false) }}
 *     currency={currency}
 *   />
 */


import { useState, useEffect, useRef, useCallback } from 'react'
import api from '../../api/axios'

// ─── Design tokens (match the rest of the app) ─────────────────────────────
const PRIMARY  = '#122C41'
const ACCENT   = '#1a7fd4'
const DANGER   = '#ef4444'
const FONT     = 'Lato, sans-serif'
const BORDER   = '#e5e7eb'

// Tax options configuration
const TAX_OPTIONS = [
  { code: 'GST 0%', percent: 0, type: 'GST' },
  { code: 'GST 5%', percent: 5, type: 'GST' },
  { code: 'GST 12%', percent: 12, type: 'GST' },
  { code: 'GST 18%', percent: 18, type: 'GST' },
  { code: 'GST 28%', percent: 28, type: 'GST' },
  { code: 'IGST 0%', percent: 0, type: 'IGST' },
  { code: 'IGST 5%', percent: 5, type: 'IGST' },
  { code: 'IGST 12%', percent: 12, type: 'IGST' },
  { code: 'IGST 18%', percent: 18, type: 'IGST' },
  { code: 'IGST 28%', percent: 28, type: 'IGST' },
]

// ─── Utilities ──────────────────────────────────────────────────────────────
const fmt = n => (n != null && !isNaN(n) ? Number(n).toLocaleString('en-IN') : '')

function numToWords(n) {
  if (!n || isNaN(n)) return ''
  const num = Math.round(Number(n))
  if (num === 0) return 'Zero'
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine',
    'Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen']
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety']
  function c(n) {
    if (n < 20) return ones[n]
    if (n < 100) return tens[Math.floor(n/10)] + (n%10 ? ' '+ones[n%10] : '')
    if (n < 1000) return ones[Math.floor(n/100)]+' Hundred'+(n%100?' '+c(n%100):'')
    if (n < 100000) return c(Math.floor(n/1000))+' Thousand'+(n%1000?' '+c(n%1000):'')
    if (n < 10000000) return c(Math.floor(n/100000))+' Lakh'+(n%100000?' '+c(n%100000):'')
    return c(Math.floor(n/10000000))+' Crore'+(n%10000000?' '+c(n%10000000):'')
  }
  return c(num) + ' Only'
}

// ─── Floating-label input ───────────────────────────────────────────────────
const base = {
  border: `1px solid ${BORDER}`, borderRadius: 8,
  padding: '12px 14px', fontSize: '13px',
  fontFamily: FONT, color: '#232323',
  outline: 'none', background: '#fff',
  width: '100%', boxSizing: 'border-box',
  transition: 'border-color 0.2s',
}
const baseFocus = {
  borderColor: ACCENT,
  boxShadow: `0 0 0 2px rgba(26, 127, 212, 0.1)`,
}
const roStyle = { ...base, background: '#f9fafb', color: '#6b7280', cursor: 'default' }
const selStyle = {
  ...base, appearance: 'none', cursor: 'pointer', paddingRight: 32,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
}

function FL({ label, children, gray, style }) {
  return (
    <div style={{ position: 'relative', ...style }}>
      <span style={{
        position: 'absolute', top: -10, left: 12,
        background: gray ? '#f9fafb' : '#fff',
        padding: '0 5px', fontSize: '11px', fontWeight: 500, color: '#6b7280',
        fontFamily: FONT, zIndex: 1, pointerEvents: 'none',
        whiteSpace: 'nowrap',
      }}>{label}</span>
      {children}
    </div>
  )
}

// ─── Empty state ────────────────────────────────────────────────────────────
function EmptyRight() {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 16,
      color: '#9ca3af', fontFamily: FONT,
    }}>
      <svg width="64" height="64" fill="none" viewBox="0 0 24 24" stroke="#d1d5db" strokeWidth={1.2}>
        <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
      </svg>
      <div style={{ fontSize: '15px', fontWeight: 600, color: '#6b7280' }}>No products added yet</div>
      <div style={{ fontSize: '13px', textAlign: 'center', maxWidth: 240 }}>
        Search and click a product on the left to add it here
      </div>
    </div>
  )
}

// ─── Single line-item card ───────────────────────────────────────────────────
function LineItemCard({ item, idx, onChange, onDelete, currency }) {
  const lineTotal = (Number(item.quantity) || 0) * (Number(item.unit_price) || 0)
  const taxAmt    = lineTotal * ((Number(item.tax_percent) || 0) / 100)

  const set = key => e => onChange(idx, key, e.target.value)

  const handleTaxChange = (e) => {
    const selectedCode = e.target.value
    const taxOption = TAX_OPTIONS.find(opt => opt.code === selectedCode)
    if (taxOption) {
      onChange(idx, 'tax_group_code', selectedCode)
      onChange(idx, 'tax_percent', taxOption.percent)
    }
  }

  // Get current tax option value
  const currentTaxValue = item.tax_group_code || 'GST 18%'
  const isValidTaxOption = TAX_OPTIONS.some(opt => opt.code === currentTaxValue)

  return (
    <div style={{
      border: `1px solid ${BORDER}`,
      borderRadius: 12,
      padding: '20px 24px',
      background: '#fff',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      display: 'flex', flexDirection: 'column', gap: 16,
      transition: 'box-shadow 0.2s',
    }}>
      {/* Card header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            background: PRIMARY, color: '#fff',
            width: 32, height: 32, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: 700, fontFamily: FONT, flexShrink: 0,
          }}>{String(idx + 1).padStart(2, '0')}</span>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: PRIMARY, fontFamily: FONT }}>
              {item.product_name_snapshot || 'Product'}
            </div>
            {item.part_no && (
              <div style={{ fontSize: '12px', color: '#6b7280', fontFamily: FONT, marginTop: 2 }}>
                Part No: {item.part_no}
              </div>
            )}
          </div>
        </div>
        <button
          onClick={() => onDelete(idx)}
          title="Remove item"
          style={{
            background: '#fff1f0', border: '1px solid #fecaca',
            borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: '12px', fontWeight: 500, color: DANGER, fontFamily: FONT,
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#fff1f0' }}
        >
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/>
          </svg>
          Delete
        </button>
      </div>

      {/* Row 1: Customer Part No | Part No. | HSN | Tax Group */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
        <FL label="Cust. Part No">
          <input style={base} value={item.customer_part_no || ''} onChange={set('customer_part_no')} placeholder="e.g. CS9191IND" />
        </FL>
        <FL label="Part No.">
          <input style={roStyle} readOnly value={item.part_no || ''} />
        </FL>
        <FL label="HSN Code">
          <input style={roStyle} readOnly value={item.hsn_snapshot || ''} />
        </FL>
        <FL label="Tax Group">
          <select 
            style={selStyle} 
            value={isValidTaxOption ? currentTaxValue : 'GST 18%'} 
            onChange={handleTaxChange}
          >
            {TAX_OPTIONS.map(opt => (
              <option key={opt.code} value={opt.code}>{opt.code}</option>
            ))}
          </select>
        </FL>
      </div>

      {/* Row 2: Unit | Qty | Unit Price | Total */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
        <FL label="Unit">
          <input style={roStyle} readOnly value={item.unit_snapshot || ''} />
        </FL>
        <FL label="Quantity *">
          <input
            style={base} type="number" min="0" step="any"
            value={item.quantity || ''}
            onChange={set('quantity')}
            placeholder="1"
          />
        </FL>
        <FL label={`Unit Price (${currency || 'INR'}) *`}>
          <input
            style={base} type="number" min="0" step="any"
            value={item.unit_price || ''}
            onChange={set('unit_price')}
            placeholder="0.00"
          />
        </FL>
        <FL label="Total" gray>
          <input style={roStyle} readOnly value={lineTotal ? `₹${fmt(lineTotal)}` : ''} />
        </FL>
      </div>

      {/* Row 3: Job Code | Description */}
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 16 }}>
        <FL label="Job Code">
          <input style={base} value={item.job_code || ''} onChange={set('job_code')} placeholder="e.g. JC-001" />
        </FL>
        <FL label="Description">
          <textarea
            style={{ ...base, resize: 'vertical', minHeight: 64 }}
            value={item.description_snapshot || ''}
            onChange={set('description_snapshot')}
            placeholder="Product description..."
          />
        </FL>
      </div>

      {/* Tax summary chip */}
      {taxAmt > 0 && (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{
            background: '#f0fdf4', border: '1px solid #bbf7d0',
            borderRadius: 20, padding: '4px 14px',
            fontSize: '12px', color: '#15803d', fontFamily: FONT, fontWeight: 500,
          }}>
            Tax ({item.tax_percent}%): ₹{fmt(taxAmt)}
          </span>
          <span style={{
            background: '#eff6ff', border: '1px solid #bfdbfe',
            borderRadius: 20, padding: '4px 14px',
            fontSize: '12px', color: '#1d4ed8', fontFamily: FONT, fontWeight: 500,
          }}>
            Incl. Tax: ₹{fmt(lineTotal + taxAmt)}
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Left Panel: Product Search ──────────────────────────────────────────────
function ProductSearchPanel({ addedProductIds, onAdd }) {
  const [query,    setQuery]    = useState('')
  const [results,  setResults]  = useState([])
  const [loading,  setLoading]  = useState(false)
  const [page,     setPage]     = useState(1)
  const [meta,     setMeta]     = useState({ total: 0, pages: 1, has_next: false })
  const debounceRef = useRef(null)

  const search = useCallback(async (q, pg = 1) => {
    setLoading(true)
    try {
      const res = await api.get('/products/search/', { params: { q, page: pg, limit: 20 } })
      const data = res.data
      // Support both old array format and new paginated format
      if (Array.isArray(data)) {
        setResults(data)
        setMeta({ total: data.length, pages: 1, has_next: false })
      } else {
        setResults(pg === 1 ? data.results : prev => [...prev, ...data.results])
        setMeta({ total: data.total, pages: data.pages, has_next: data.has_next })
      }
      setPage(pg)
    } catch (e) {
      console.error('Product search failed:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load + debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(query, 1), query ? 320 : 0)
    return () => clearTimeout(debounceRef.current)
  }, [query, search])

  return (
    <div style={{
      width: 340, flexShrink: 0,
      borderRight: `1px solid ${BORDER}`,
      display: 'flex', flexDirection: 'column',
      background: '#fafbfc',
    }}>
      {/* Panel header */}
      <div style={{ padding: '18px 20px', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: PRIMARY, fontFamily: FONT, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Product Master
        </div>
        {/* Search input */}
        <div style={{ position: 'relative' }}>
          <svg
            width="16" height="16" fill="none" viewBox="0 0 24 24"
            stroke="#9ca3af" strokeWidth={2}
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          >
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            style={{
              ...base, paddingLeft: 40, fontSize: '13px',
              background: '#fff',
            }}
            placeholder="Search by Name or Part Number"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af',
                display: 'flex', padding: 4,
              }}
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>
        {meta.total > 0 && (
          <div style={{ fontSize: '12px', color: '#9ca3af', fontFamily: FONT, marginTop: 8 }}>
            {meta.total.toLocaleString()} product{meta.total !== 1 ? 's' : ''} found
          </div>
        )}
      </div>

      {/* Results list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading && results.length === 0 ? (
          <div style={{ padding: 30, textAlign: 'center', color: '#9ca3af', fontSize: '13px', fontFamily: FONT }}>
            Searching...
          </div>
        ) : results.length === 0 ? (
          <div style={{ padding: 30, textAlign: 'center', color: '#9ca3af', fontSize: '13px', fontFamily: FONT }}>
            {query ? 'No products match your search' : 'Start typing to search'}
          </div>
        ) : (
          <>
            {results.map(product => {
              const alreadyAdded = addedProductIds.includes(product.id)
              return (
                <div
                  key={product.id}
                  style={{
                    padding: '14px 16px',
                    borderBottom: `1px solid ${BORDER}`,
                    cursor: alreadyAdded ? 'default' : 'pointer',
                    background: alreadyAdded ? '#f0f9ff' : '#fff',
                    transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                  }}
                  onMouseEnter={e => { if (!alreadyAdded) e.currentTarget.style.background = '#f8fafc' }}
                  onMouseLeave={e => { e.currentTarget.style.background = alreadyAdded ? '#f0f9ff' : '#fff' }}
                  onClick={() => !alreadyAdded && onAdd(product)}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: PRIMARY, fontFamily: FONT, marginBottom: 4 }}>
                      {product.part_no}
                    </div>
                    <div style={{ fontSize: '12px', color: '#4b5563', fontFamily: FONT, marginBottom: 4, lineHeight: 1.4 }}>
                      {product.name}
                    </div>
                    {product.default_sale_price && (
                      <div style={{ fontSize: '12px', fontWeight: 600, color: ACCENT, fontFamily: FONT }}>
                        ₹{fmt(product.default_sale_price)}
                      </div>
                    )}
                  </div>
                  {alreadyAdded ? (
                    <span style={{
                      flexShrink: 0, background: '#dcfce7', border: '1px solid #86efac',
                      borderRadius: 14, padding: '4px 12px',
                      fontSize: '11px', fontWeight: 600, color: '#15803d', fontFamily: FONT,
                    }}>Added</span>
                  ) : (
                    <div style={{
                      flexShrink: 0,
                      width: 28, height: 28, borderRadius: '50%',
                      background: PRIMARY, color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'transform 0.1s',
                    }}>
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                    </div>
                  )}
                </div>
              )
            })}

            {/* Load more */}
            {meta.has_next && (
              <button
                onClick={() => search(query, page + 1)}
                disabled={loading}
                style={{
                  width: '100%', padding: '12px',
                  background: '#fff', border: 'none',
                  borderTop: `1px solid ${BORDER}`,
                  cursor: loading ? 'default' : 'pointer',
                  fontSize: '12px', color: ACCENT, fontFamily: FONT, fontWeight: 500,
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#f8fafc' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff' }}
              >
                {loading ? 'Loading...' : `Load more (${meta.total - results.length} remaining)`}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─── Main modal ──────────────────────────────────────────────────────────────
export default function AddProductsModal({ open, onClose, initialItems = [], onSave, currency = 'INR' }) {

  const [items, setItems] = useState([])

  // Sync from parent when modal opens
  useEffect(() => {
    if (open) setItems(initialItems.map(i => ({ ...i })))
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null

  // IDs already in the list (to show "Added" badge)
  const addedIds = items.filter(i => i._productId).map(i => i._productId)

  // ── Add product from search ──
  const handleAddProduct = product => {
    // If same product already in list just scroll / highlight (don't duplicate)
    if (addedIds.includes(product.id)) return

    const newItem = {
      _productId:            product.id,              // internal ref only
      product:               product.id,              // FK to send to backend
      job_code:              '',
      customer_part_no:      '',
      part_no:               product.part_no || '',
      product_name_snapshot: product.name,
      description_snapshot:  product.description || '',
      hsn_snapshot:          product.hsn_code || '',
      unit_snapshot:         product.unit_symbol || product.unit_name || '',
      quantity:              '',
      unit_price:            product.default_sale_price || '',
      tax_percent:           18,
      tax_group_code:        'GST 18%',
    }
    setItems(prev => [...prev, newItem])
  }

  // ── Update a field in a line item ──
  const handleChange = (idx, key, value) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [key]: value } : item))
  }

  // ── Delete a line item ──
  const handleDelete = idx => {
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  // ── Save: validate & pass to parent ──
  const handleSave = () => {
    const invalid = items.find(i => !i.product_name_snapshot || !i.quantity || !i.unit_price)
    if (invalid) {
      alert('Each product requires a Name, Quantity, and Unit Price.')
      return
    }
    const final = items.map(item => {
      const lineTotal = (Number(item.quantity) || 0) * (Number(item.unit_price) || 0)
      const taxAmt    = lineTotal * ((Number(item.tax_percent) || 0) / 100)
      return { ...item, line_total: lineTotal, tax_amount: taxAmt }
    })
    onSave(final)
  }

  // ── Totals ──
  const totalOrderValue = items.reduce((s, i) => s + (Number(i.quantity)||0)*(Number(i.unit_price)||0), 0)
  const totalTax        = items.reduce((s, i) => {
    const lt = (Number(i.quantity)||0)*(Number(i.unit_price)||0)
    return s + lt * ((Number(i.tax_percent)||0)/100)
  }, 0)
  const grandTotal = totalOrderValue + totalTax

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(10,20,35,0.5)', zIndex: 1200 }}
      />

      {/* Modal shell */}
      <div style={{
        position: 'fixed',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'min(96vw, 1280px)',
        height: 'min(92vh, 900px)',
        background: '#fff',
        borderRadius: 16,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1201,
        fontFamily: FONT,
        boxShadow: '0 32px 100px rgba(0,0,0,0.26)',
        overflow: 'hidden',
      }}>

        {/* ── Header ── */}
        <div style={{
          padding: '20px 28px',
          borderBottom: `1px solid ${BORDER}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
          background: '#fff',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 10,
              background: PRIMARY,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2}>
                <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: PRIMARY, fontFamily: FONT }}>
                Product Details
              </div>
              <div style={{ fontSize: '13px', color: '#6b7280', fontFamily: FONT, marginTop: 2 }}>
                Search and add products from your product master
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {items.length > 0 && (
              <span style={{
                background: '#eff6ff', border: '1px solid #bfdbfe',
                borderRadius: 24, padding: '5px 16px',
                fontSize: '13px', fontWeight: 600, color: '#1d4ed8', fontFamily: FONT,
              }}>
                {items.length} item{items.length !== 1 ? 's' : ''}
              </span>
            )}
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex', padding: 6, borderRadius: 6 }}
            >
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ── Body: two panels ── */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Left: Search panel */}
          <ProductSearchPanel
            addedProductIds={addedIds}
            onAdd={handleAddProduct}
          />

          {/* Right: Line items */}
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            overflow: 'hidden', background: '#fff',
          }}>
            {/* Right header */}
            <div style={{
              padding: '16px 24px',
              borderBottom: `1px solid ${BORDER}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexShrink: 0,
              background: '#fff',
            }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: PRIMARY, fontFamily: FONT }}>
                Product Details ({items.length})
              </span>
              {items.length > 0 && (
                <button
                  onClick={() => setItems([])}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: '12px', color: DANGER, fontFamily: FONT, fontWeight: 500,
                    padding: '4px 8px',
                  }}
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Scrollable cards */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              {items.length === 0 ? (
                <EmptyRight />
              ) : (
                items.map((item, idx) => (
                  <LineItemCard
                    key={`${item._productId || idx}-${idx}`}
                    item={item}
                    idx={idx}
                    onChange={handleChange}
                    onDelete={handleDelete}
                    currency={currency}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: '18px 28px',
          borderTop: `1px solid ${BORDER}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0, background: '#fff',
        }}>
          {/* Totals */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {grandTotal > 0 ? (
              <>
                <div style={{ display: 'flex', gap: 28 }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', fontFamily: FONT, marginBottom: 2 }}>Sub Total</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#374151', fontFamily: FONT }}>
                      ₹{fmt(totalOrderValue)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', fontFamily: FONT, marginBottom: 2 }}>Tax</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#374151', fontFamily: FONT }}>
                      ₹{fmt(totalTax)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', fontFamily: FONT, marginBottom: 2 }}>Grand Total</div>
                    <div style={{ fontSize: '17px', fontWeight: 700, color: PRIMARY, fontFamily: FONT }}>
                      {currency} {fmt(grandTotal)}/-
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: '#9ca3af', fontFamily: FONT }}>
                  {numToWords(grandTotal)}
                </div>
              </>
            ) : (
              <div style={{ fontSize: '13px', color: '#9ca3af', fontFamily: FONT }}>
                Add products to see totals
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 24px', border: `1px solid ${BORDER}`,
                borderRadius: 8, background: '#fff', cursor: 'pointer',
                fontSize: '13px', fontWeight: 500, color: '#374151', fontFamily: FONT,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fff' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={items.length === 0}
              style={{
                padding: '10px 26px', border: 'none',
                borderRadius: 8,
                background: items.length === 0 ? '#94a3b8' : PRIMARY,
                cursor: items.length === 0 ? 'not-allowed' : 'pointer',
                fontSize: '13px', fontWeight: 600, color: '#fff', fontFamily: FONT,
                display: 'flex', alignItems: 'center', gap: 8,
                transition: 'background 0.2s',
              }}
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
              Save Products ({items.length})
            </button>
          </div>
        </div>

      </div>
    </>
  )
}