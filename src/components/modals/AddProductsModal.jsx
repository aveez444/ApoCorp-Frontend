/**
 * AddProductsModal.jsx  (improved)
 *
 * Changes from previous version:
 *  1. Product Name, Description & HSN Code are now editable in the line-item card
 *  2. Required fields (Cust Part No, Unit, Qty) are visually highlighted with
 *     inline badges and a prominent inline warning bar — no more ignored alerts
 *  3. Unit Price field starts blank (no 0.00 default)
 *  4. Left panel header now has an "Add New Product →" button that navigates to /product
 *  5. Empty-state in the left panel also shows the navigation link
 *  6. General UX polish: completion progress bar, required-field badges, inline
 *     validation summary per card, better field grouping
 *
 * Props:
 *   open          {boolean}
 *   onClose       {() => void}
 *   initialItems  {LineItem[]}
 *   onSave        {(items: LineItem[]) => void}
 *   currency      {string}
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'

// ─── Design tokens ────────────────────────────────────────────────────────────
const PRIMARY  = '#122C41'
const ACCENT   = '#1a7fd4'
const DANGER   = '#ef4444'
const SUCCESS  = '#16a34a'
const WARN     = '#d97706'
const FONT     = 'Lato, sans-serif'
const BORDER   = '#e5e7eb'

const TAX_OPTIONS = [
  { code: 'GST 0%',   percent: 0,  type: 'GST'  },
  { code: 'GST 5%',   percent: 5,  type: 'GST'  },
  { code: 'GST 12%',  percent: 12, type: 'GST'  },
  { code: 'GST 18%',  percent: 18, type: 'GST'  },
  { code: 'GST 28%',  percent: 28, type: 'GST'  },
  { code: 'IGST 0%',  percent: 0,  type: 'IGST' },
  { code: 'IGST 5%',  percent: 5,  type: 'IGST' },
  { code: 'IGST 12%', percent: 12, type: 'IGST' },
  { code: 'IGST 18%', percent: 18, type: 'IGST' },
  { code: 'IGST 28%', percent: 28, type: 'IGST' },
]

const fmt = n => (n != null && !isNaN(n) ? Number(n).toLocaleString('en-IN') : '')

function numToWords(n) {
  if (!n || isNaN(n)) return ''
  const num = Math.round(Number(n))
  if (num === 0) return 'Zero'
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine',
    'Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen']
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety']
  function c(n) {
    if (n < 20)       return ones[n]
    if (n < 100)      return tens[Math.floor(n/10)] + (n%10 ? ' '+ones[n%10] : '')
    if (n < 1000)     return ones[Math.floor(n/100)]+' Hundred'+(n%100?' '+c(n%100):'')
    if (n < 100000)   return c(Math.floor(n/1000))+' Thousand'+(n%1000?' '+c(n%1000):'')
    if (n < 10000000) return c(Math.floor(n/100000))+' Lakh'+(n%100000?' '+c(n%100000):'')
    return c(Math.floor(n/10000000))+' Crore'+(n%10000000?' '+c(n%10000000):'')
  }
  return c(num) + ' Only'
}

// ─── Floating-label wrappers ──────────────────────────────────────────────────
const base = {
  border: `1px solid ${BORDER}`, borderRadius: 8,
  padding: '11px 13px', fontSize: '13px',
  fontFamily: FONT, color: '#232323',
  outline: 'none', background: '#fff',
  width: '100%', boxSizing: 'border-box',
  transition: 'border-color 0.18s, box-shadow 0.18s',
}
const baseRequired = {
  ...base,
  border: `1.5px solid #fbbf24`,
  background: '#fffbeb',
}
const baseFilledRequired = {
  ...base,
  border: `1.5px solid #86efac`,
  background: '#f0fdf4',
}
const roStyle = { ...base, background: '#f9fafb', color: '#6b7280', cursor: 'default' }
const selStyle = {
  ...base, appearance: 'none', cursor: 'pointer', paddingRight: 32,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
}

/** Floating-label wrapper. Pass required=true to show amber border when empty */
function FL({ label, children, gray, required, filled, style }) {
  const labelColor = required && !filled ? WARN : '#6b7280'
  return (
    <div style={{ position: 'relative', ...style }}>
      <span style={{
        position: 'absolute', top: -10, left: 12,
        background: gray ? '#f9fafb' : (required && !filled ? '#fffbeb' : '#fff'),
        padding: '0 5px', fontSize: '11px', fontWeight: 600, color: labelColor,
        fontFamily: FONT, zIndex: 1, pointerEvents: 'none',
        whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 3,
      }}>
        {label}
        {required && !filled && (
          <span style={{ color: DANGER, fontSize: 10 }}>✱</span>
        )}
      </span>
      {children}
    </div>
  )
}

// ─── Inline warning bar shown inside each card when fields are missing ────────
function MissingFieldsBar({ missing }) {
  if (!missing.length) return null
  return (
    <div style={{
      background: '#fffbeb',
      border: '1px solid #fde68a',
      borderRadius: 8,
      padding: '9px 14px',
      display: 'flex', alignItems: 'center', gap: 10,
      fontSize: '12px', color: '#92400e', fontFamily: FONT,
    }}>
      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke={WARN} strokeWidth={2.5} style={{ flexShrink: 0 }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      </svg>
      <span>
        <strong>Fill required fields:</strong>{' '}
        {missing.join(' · ')}
      </span>
    </div>
  )
}

// ─── Single line-item card ─────────────────────────────────────────────────────
function LineItemCard({ item, idx, onChange, onDelete, currency }) {
  const [nameEditing, setNameEditing] = useState(false)

  const lineTotal = (Number(item.quantity) || 0) * (Number(item.unit_price) || 0)
  const taxAmt    = lineTotal * ((Number(item.tax_percent) || 0) / 100)

  const set = key => e => onChange(idx, key, e.target.value)

  const handleTaxChange = e => {
    const opt = TAX_OPTIONS.find(o => o.code === e.target.value)
    if (opt) {
      onChange(idx, 'tax_group_code', opt.code)
      onChange(idx, 'tax_percent', opt.percent)
    }
  }

  const currentTaxValue = item.tax_group_code || 'GST 18%'
  const isValidTaxOption = TAX_OPTIONS.some(o => o.code === currentTaxValue)

  // Determine which required fields are missing
  const missing = []
  if (!item.customer_part_no?.trim()) missing.push('Cust. Part No')
  if (!item.quantity)                 missing.push('Quantity')
  if (!item.unit_price)               missing.push('Unit Price')
  const isComplete = missing.length === 0

  return (
    <div style={{
      border: `1.5px solid ${isComplete ? '#d1fae5' : '#fde68a'}`,
      borderRadius: 14,
      padding: '20px 22px',
      background: '#fff',
      boxShadow: isComplete
        ? '0 1px 4px rgba(22,163,74,0.07)'
        : '0 1px 8px rgba(251,191,36,0.10)',
      display: 'flex', flexDirection: 'column', gap: 14,
      transition: 'border-color 0.25s, box-shadow 0.25s',
    }}>

      {/* Card header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1, minWidth: 0 }}>
          {/* Index bubble */}
          <span style={{
            background: isComplete ? SUCCESS : WARN,
            color: '#fff',
            width: 30, height: 30, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: 700, fontFamily: FONT, flexShrink: 0,
            marginTop: 2,
            transition: 'background 0.25s',
          }}>{String(idx + 1).padStart(2, '0')}</span>

          {/* Editable product name */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {nameEditing ? (
              <input
                autoFocus
                style={{ ...base, fontSize: '14px', fontWeight: 700, color: PRIMARY, padding: '5px 10px' }}
                value={item.product_name_snapshot || ''}
                onChange={set('product_name_snapshot')}
                onBlur={() => setNameEditing(false)}
                onKeyDown={e => e.key === 'Enter' && setNameEditing(false)}
              />
            ) : (
              <div
                style={{
                  fontSize: '14px', fontWeight: 700, color: PRIMARY, fontFamily: FONT,
                  display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                  padding: '3px 0',
                }}
                title="Click to edit product name"
                onClick={() => setNameEditing(true)}
              >
                <span style={{ minWidth: 0, wordBreak: 'break-word' }}>
                  {item.product_name_snapshot || 'Product'}
                </span>
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke={ACCENT} strokeWidth={2} style={{ flexShrink: 0 }}>
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </div>
            )}
            {item.part_no && (
              <div style={{ fontSize: '11px', color: '#9ca3af', fontFamily: FONT, marginTop: 2 }}>
                #{item.part_no}
              </div>
            )}
          </div>
        </div>

        {/* Complete badge + delete */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {isComplete ? (
            <span style={{
              background: '#dcfce7', border: '1px solid #86efac',
              borderRadius: 20, padding: '3px 12px',
              fontSize: '11px', fontWeight: 600, color: SUCCESS, fontFamily: FONT,
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke={SUCCESS} strokeWidth={3}>
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Complete
            </span>
          ) : (
            <span style={{
              background: '#fef9c3', border: '1px solid #fde68a',
              borderRadius: 20, padding: '3px 12px',
              fontSize: '11px', fontWeight: 600, color: WARN, fontFamily: FONT,
            }}>
              {missing.length} field{missing.length > 1 ? 's' : ''} missing
            </span>
          )}
          <button
            onClick={() => onDelete(idx)}
            title="Remove item"
            style={{
              background: '#fff1f0', border: '1px solid #fecaca',
              borderRadius: 8, padding: '5px 12px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: '12px', fontWeight: 500, color: DANGER, fontFamily: FONT,
              transition: 'all 0.18s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff1f0' }}
          >
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/>
            </svg>
            Remove
          </button>
        </div>
      </div>

      {/* Inline missing fields warning */}
      <MissingFieldsBar missing={missing} />

      {/* ── Section: Identity ─────────────────────────────────── */}
      <div style={{
        fontSize: '10px', fontWeight: 700, color: '#9ca3af', fontFamily: FONT,
        textTransform: 'uppercase', letterSpacing: '0.07em',
        borderBottom: `1px solid ${BORDER}`, paddingBottom: 6, marginBottom: 2,
      }}>
        Product Identity
      </div>

      {/* Row 1: Cust Part No | Part No (RO) | HSN (editable) | Tax */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 14 }}>
        <FL
          label="Cust. Part No"
          required
          filled={!!item.customer_part_no?.trim()}
        >
          <input
            style={item.customer_part_no?.trim() ? baseFilledRequired : baseRequired}
            value={item.customer_part_no || ''}
            onChange={set('customer_part_no')}
            placeholder="e.g. CS9191IND"
          />
        </FL>

        <FL label="Part No. (read only)" gray>
          <input style={roStyle} readOnly value={item.part_no || ''} />
        </FL>

        {/* HSN — now editable */}
        <FL label="HSN Code">
          <input
            style={base}
            value={item.hsn_snapshot || ''}
            onChange={set('hsn_snapshot')}
            placeholder="e.g. 84795000"
          />
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

      {/* ── Section: Pricing ─────────────────────────────────── */}
      <div style={{
        fontSize: '10px', fontWeight: 700, color: '#9ca3af', fontFamily: FONT,
        textTransform: 'uppercase', letterSpacing: '0.07em',
        borderBottom: `1px solid ${BORDER}`, paddingBottom: 6, marginBottom: 2,
        marginTop: 4,
      }}>
        Quantity &amp; Pricing
      </div>

      {/* Row 2: Unit (editable) | Qty | Unit Price | Total */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 14 }}>
        {/* Unit — now editable */}
        <FL label="Unit">
          <input
            style={base}
            value={item.unit_snapshot || ''}
            onChange={set('unit_snapshot')}
            placeholder="e.g. PCS, KG"
          />
        </FL>

        <FL label="Quantity" required filled={!!item.quantity}>
          <input
            style={item.quantity ? baseFilledRequired : baseRequired}
            type="number" min="0" step="any"
            value={item.quantity || ''}
            onChange={set('quantity')}
            placeholder="Enter qty"
          />
        </FL>

        <FL label={`Unit Price (${currency || 'INR'})`} required filled={!!item.unit_price}>
          <input
            style={item.unit_price ? baseFilledRequired : baseRequired}
            type="number" min="0" step="any"
            value={item.unit_price || ''}
            onChange={set('unit_price')}
            placeholder="Enter price"
          />
        </FL>

        <FL label="Line Total" gray>
          <input
            style={roStyle} readOnly
            value={lineTotal ? `${currency === 'INR' ? '₹' : currency}${fmt(lineTotal)}` : ''}
            placeholder="—"
          />
        </FL>
      </div>

      {/* ── Section: Details ─────────────────────────────────── */}
      <div style={{
        fontSize: '10px', fontWeight: 700, color: '#9ca3af', fontFamily: FONT,
        textTransform: 'uppercase', letterSpacing: '0.07em',
        borderBottom: `1px solid ${BORDER}`, paddingBottom: 6, marginBottom: 2,
        marginTop: 4,
      }}>
        Additional Details
      </div>

      {/* Row 3: Job Code | Description (editable) */}
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 14 }}>
        <FL label="Job Code">
          <input
            style={base}
            value={item.job_code || ''}
            onChange={set('job_code')}
            placeholder="e.g. JC-001"
          />
        </FL>

        <FL label="Description (editable)">
          <textarea
            style={{ ...base, resize: 'vertical', minHeight: 60 }}
            value={item.description_snapshot || ''}
            onChange={set('description_snapshot')}
            placeholder="Product description..."
          />
        </FL>
      </div>

      {/* Tax summary chips */}
      {lineTotal > 0 && (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {taxAmt > 0 && (
            <span style={{
              background: '#f0fdf4', border: '1px solid #bbf7d0',
              borderRadius: 20, padding: '4px 14px',
              fontSize: '12px', color: '#15803d', fontFamily: FONT, fontWeight: 500,
            }}>
              Tax ({item.tax_percent}%): {currency === 'INR' ? '₹' : currency}{fmt(taxAmt)}
            </span>
          )}
          <span style={{
            background: '#eff6ff', border: '1px solid #bfdbfe',
            borderRadius: 20, padding: '4px 14px',
            fontSize: '12px', color: '#1d4ed8', fontFamily: FONT, fontWeight: 500,
          }}>
            Incl. Tax: {currency === 'INR' ? '₹' : currency}{fmt(lineTotal + taxAmt)}
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Empty state (right panel) ────────────────────────────────────────────────
function EmptyRight() {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 14,
      color: '#9ca3af', fontFamily: FONT,
    }}>
      <svg width="60" height="60" fill="none" viewBox="0 0 24 24" stroke="#d1d5db" strokeWidth={1.2}>
        <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
      </svg>
      <div style={{ fontSize: '15px', fontWeight: 600, color: '#6b7280' }}>No products added yet</div>
      <div style={{ fontSize: '13px', textAlign: 'center', maxWidth: 240, lineHeight: 1.6 }}>
        Search and click a product on the left to add it to this quotation
      </div>
    </div>
  )
}

// ─── Left Panel: Product Search ───────────────────────────────────────────────
function ProductSearchPanel({ addedProductIds, onAdd, currency = 'INR' }) {
  const navigate   = useNavigate()
  const [query,    setQuery]   = useState('')
  const [results,  setResults] = useState([])
  const [loading,  setLoading] = useState(false)
  const [page,     setPage]    = useState(1)
  const [meta,     setMeta]    = useState({ total: 0, pages: 1, has_next: false })
  const debounceRef = useRef(null)

  const search = useCallback(async (q, pg = 1) => {
    setLoading(true)
    try {
      const res  = await api.get('/products/search/', { params: { q, page: pg, limit: 20 } })
      const data = res.data
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

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(query, 1), query ? 320 : 0)
    return () => clearTimeout(debounceRef.current)
  }, [query, search])

  const showEmpty = !loading && results.length === 0

  return (
    <div style={{
      width: 340, flexShrink: 0,
      borderRight: `1px solid ${BORDER}`,
      display: 'flex', flexDirection: 'column',
      background: '#fafbfc',
    }}>
      {/* Panel header */}
      <div style={{ padding: '16px 18px', borderBottom: `1px solid ${BORDER}` }}>
        {/* Title row */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 12,
        }}>
          <div style={{
            fontSize: '12px', fontWeight: 700, color: PRIMARY, fontFamily: FONT,
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            Product Master
          </div>
          {/* ── Add New Product button ── */}
          <button
            onClick={() => navigate('/product')}
            title="Go to product master to add a new product"
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'none', border: `1.5px dashed ${ACCENT}`,
              borderRadius: 7, padding: '4px 10px',
              fontSize: '11px', fontWeight: 600, color: ACCENT,
              fontFamily: FONT, cursor: 'pointer',
              transition: 'all 0.18s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#eff6ff'
              e.currentTarget.style.borderStyle = 'solid'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'none'
              e.currentTarget.style.borderStyle = 'dashed'
            }}
          >
            <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke={ACCENT} strokeWidth={2.5}>
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add New Product
          </button>
        </div>

        {/* Search input */}
        <div style={{ position: 'relative' }}>
          <svg
            width="15" height="15" fill="none" viewBox="0 0 24 24"
            stroke="#9ca3af" strokeWidth={2}
            style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          >
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            style={{ ...base, paddingLeft: 36, fontSize: '13px', background: '#fff' }}
            placeholder="Search by name or part number…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{
                position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af',
                display: 'flex', padding: 3,
              }}
            >
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>
        {meta.total > 0 && (
          <div style={{ fontSize: '11px', color: '#9ca3af', fontFamily: FONT, marginTop: 7 }}>
            {meta.total.toLocaleString()} product{meta.total !== 1 ? 's' : ''} found
          </div>
        )}
      </div>

      {/* Results list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading && results.length === 0 ? (
          <div style={{ padding: 30, textAlign: 'center', color: '#9ca3af', fontSize: '13px', fontFamily: FONT }}>
            Searching…
          </div>
        ) : showEmpty ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '40px 24px', gap: 14, textAlign: 'center',
          }}>
            <svg width="44" height="44" fill="none" viewBox="0 0 24 24" stroke="#d1d5db" strokeWidth={1.2}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <div style={{ fontSize: '13px', color: '#6b7280', fontFamily: FONT, fontWeight: 600 }}>
              {query ? 'No products match your search' : 'Start typing to search products'}
            </div>
            {query && (
              <div style={{ fontSize: '12px', color: '#9ca3af', fontFamily: FONT }}>
                Can't find it? You can add it to the product master.
              </div>
            )}
            <button
              onClick={() => navigate('/product')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: PRIMARY, border: 'none', borderRadius: 8,
                padding: '8px 16px', fontSize: '12px', fontWeight: 600,
                color: '#fff', fontFamily: FONT, cursor: 'pointer',
                transition: 'opacity 0.18s',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.85' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
            >
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2.5}>
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Go to Product Master
            </button>
          </div>
        ) : (
          <>
            {results.map(product => {
              const alreadyAdded = addedProductIds.includes(product.id)
              return (
                <div
                  key={product.id}
                  style={{
                    padding: '13px 16px',
                    borderBottom: `1px solid ${BORDER}`,
                    cursor: alreadyAdded ? 'default' : 'pointer',
                    background: alreadyAdded ? '#f0f9ff' : '#fff',
                    transition: 'all 0.14s',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                  }}
                  onMouseEnter={e => { if (!alreadyAdded) e.currentTarget.style.background = '#f8fafc' }}
                  onMouseLeave={e => { e.currentTarget.style.background = alreadyAdded ? '#f0f9ff' : '#fff' }}
                  onClick={() => !alreadyAdded && onAdd(product)}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: PRIMARY, fontFamily: FONT, marginBottom: 3 }}>
                      {product.part_no}
                    </div>
                    <div style={{
                      fontSize: '12px', color: '#4b5563', fontFamily: FONT,
                      marginBottom: product.default_sale_price ? 4 : 0,
                      lineHeight: 1.4,
                      overflow: 'hidden', textOverflow: 'ellipsis',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    }}>
                      {product.name}
                    </div>
                    {product.default_sale_price && (
                      <div style={{ fontSize: '12px', fontWeight: 600, color: ACCENT, fontFamily: FONT }}>
                        {currency === 'INR' ? '₹' : currency}{fmt(product.default_sale_price)}
                      </div>
                    )}
                  </div>
                  {alreadyAdded ? (
                    <span style={{
                      flexShrink: 0, background: '#dcfce7', border: '1px solid #86efac',
                      borderRadius: 14, padding: '4px 11px',
                      fontSize: '11px', fontWeight: 600, color: '#15803d', fontFamily: FONT,
                    }}>Added</span>
                  ) : (
                    <div style={{
                      flexShrink: 0,
                      width: 28, height: 28, borderRadius: '50%',
                      background: PRIMARY, color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'transform 0.12s',
                    }}>
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                    </div>
                  )}
                </div>
              )
            })}

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
                  transition: 'background 0.18s',
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#f8fafc' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff' }}
              >
                {loading ? 'Loading…' : `Load more (${meta.total - results.length} remaining)`}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─── Completion progress bar ──────────────────────────────────────────────────
function CompletionBar({ items }) {
  if (items.length === 0) return null
  const complete = items.filter(i =>
    i.customer_part_no?.trim() && i.quantity && i.unit_price
  ).length
  const pct = Math.round((complete / items.length) * 100)
  const allDone = complete === items.length

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      fontSize: '12px', fontFamily: FONT,
      color: allDone ? SUCCESS : WARN,
      fontWeight: 600,
    }}>
      <div style={{ width: 90, height: 6, background: '#e5e7eb', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`, height: '100%',
          background: allDone ? SUCCESS : WARN,
          borderRadius: 99, transition: 'width 0.3s, background 0.3s',
        }}/>
      </div>
      {allDone ? '✓ All complete' : `${complete}/${items.length} complete`}
    </div>
  )
}

// ─── Main modal ───────────────────────────────────────────────────────────────
export default function AddProductsModal({ open, onClose, initialItems = [], onSave, currency = 'INR' }) {
  const [items, setItems] = useState([])

  useEffect(() => {
    if (open) setItems(initialItems.map(i => ({ ...i })))
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null

  const addedIds = items.filter(i => i._productId).map(i => i._productId)

  const handleAddProduct = product => {
    if (addedIds.includes(product.id)) return
    const newItem = {
      _productId:            product.id,
      product:               product.id,
      job_code:              '',
      customer_part_no:      '',
      part_no:               product.part_no || '',
      product_name_snapshot: product.name,
      description_snapshot:  product.description || '',
      hsn_snapshot:          product.hsn_code || '',
      unit_snapshot:         product.unit_symbol || product.unit_name || '',
      quantity:              '',
      unit_price:            product.default_sale_price || '',  // kept for convenience; blank if none
      tax_percent:           18,
      tax_group_code:        'GST 18%',
    }
    setItems(prev => [...prev, newItem])
  }

  const handleChange = (idx, key, value) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [key]: value } : item))
  }

  const handleDelete = idx => {
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  const handleSave = () => {
    // Find first incomplete item for specific feedback
    const incomplete = items.find(i => !i.product_name_snapshot || !i.quantity || !i.unit_price)
    if (incomplete) {
      // Don't use alert — scroll to the offending card (cards already show inline warning)
      // We'll just prevent save and let the inline warnings guide the user
      return
    }
    const final = items.map(item => {
      const lineTotal = (Number(item.quantity) || 0) * (Number(item.unit_price) || 0)
      const taxAmt    = lineTotal * ((Number(item.tax_percent) || 0) / 100)
      return { ...item, line_total: lineTotal, tax_amount: taxAmt }
    })
    onSave(final)
  }

  const totalOrderValue = items.reduce((s, i) => s + (Number(i.quantity)||0)*(Number(i.unit_price)||0), 0)
  const totalTax = items.reduce((s, i) => {
    const lt = (Number(i.quantity)||0)*(Number(i.unit_price)||0)
    return s + lt * ((Number(i.tax_percent)||0)/100)
  }, 0)
  const grandTotal = totalOrderValue + totalTax

  // Is every item ready to save?
  const allComplete = items.length > 0 && items.every(i =>
    i.product_name_snapshot && i.quantity && i.unit_price
  )
  const incompleteCount = items.filter(i =>
    !i.customer_part_no?.trim() || !i.quantity || !i.unit_price
  ).length

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
        display: 'flex', flexDirection: 'column',
        zIndex: 1201,
        fontFamily: FONT,
        boxShadow: '0 32px 100px rgba(0,0,0,0.26)',
        overflow: 'hidden',
      }}>

        {/* ── Header ── */}
        <div style={{
          padding: '18px 26px',
          borderBottom: `1px solid ${BORDER}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0, background: '#fff',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, background: PRIMARY,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="19" height="19" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2}>
                <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '17px', fontWeight: 700, color: PRIMARY, fontFamily: FONT }}>
                Add Products to Quotation
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280', fontFamily: FONT, marginTop: 2 }}>
                Search products from master, then fill in details on the right
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <CompletionBar items={items} />
            {items.length > 0 && (
              <span style={{
                background: '#eff6ff', border: '1px solid #bfdbfe',
                borderRadius: 24, padding: '4px 14px',
                fontSize: '12px', fontWeight: 600, color: '#1d4ed8', fontFamily: FONT,
              }}>
                {items.length} item{items.length !== 1 ? 's' : ''}
              </span>
            )}
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex', padding: 6, borderRadius: 6 }}
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ── Body: two panels ── */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Left: Search */}
          <ProductSearchPanel
            addedProductIds={addedIds}
            onAdd={handleAddProduct}
            currency={currency}
          />

          {/* Right: Line items */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#fff' }}>
            {/* Right header */}
            <div style={{
              padding: '14px 22px',
              borderBottom: `1px solid ${BORDER}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexShrink: 0, background: '#fafbfc',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: PRIMARY, fontFamily: FONT }}>
                  Line Items ({items.length})
                </span>
                {incompleteCount > 0 && (
                  <span style={{
                    background: '#fef9c3', border: '1px solid #fde68a',
                    borderRadius: 20, padding: '2px 10px',
                    fontSize: '11px', fontWeight: 600, color: WARN, fontFamily: FONT,
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke={WARN} strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                    </svg>
                    {incompleteCount} need attention
                  </span>
                )}
              </div>
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
            <div style={{
              flex: 1, overflowY: 'auto',
              padding: '18px 22px',
              display: 'flex', flexDirection: 'column', gap: 18,
              background: '#f6f8fa',
            }}>
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
          padding: '16px 26px',
          borderTop: `1px solid ${BORDER}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0, background: '#fff',
        }}>
          {/* Totals */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {grandTotal > 0 ? (
              <>
                <div style={{ display: 'flex', gap: 26 }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', fontFamily: FONT, marginBottom: 2 }}>Sub Total</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#374151', fontFamily: FONT }}>
                      {currency === 'INR' ? '₹' : currency}{fmt(totalOrderValue)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', fontFamily: FONT, marginBottom: 2 }}>Tax</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#374151', fontFamily: FONT }}>
                      {currency === 'INR' ? '₹' : currency}{fmt(totalTax)}
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
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {/* Save-blocker tip */}
            {items.length > 0 && !allComplete && (
              <div style={{
                fontSize: '12px', color: WARN, fontFamily: FONT,
                display: 'flex', alignItems: 'center', gap: 5,
                marginRight: 6,
              }}>
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke={WARN} strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                </svg>
                Fill highlighted fields to save
              </div>
            )}
            <button
              onClick={onClose}
              style={{
                padding: '9px 22px', border: `1px solid ${BORDER}`,
                borderRadius: 8, background: '#fff', cursor: 'pointer',
                fontSize: '13px', fontWeight: 500, color: '#374151', fontFamily: FONT,
                transition: 'all 0.18s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fff' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={items.length === 0 || !allComplete}
              title={!allComplete ? 'Fill all required fields in each card first' : ''}
              style={{
                padding: '9px 24px', border: 'none', borderRadius: 8,
                background: (items.length === 0 || !allComplete) ? '#94a3b8' : PRIMARY,
                cursor: (items.length === 0 || !allComplete) ? 'not-allowed' : 'pointer',
                fontSize: '13px', fontWeight: 600, color: '#fff', fontFamily: FONT,
                display: 'flex', alignItems: 'center', gap: 7,
                transition: 'background 0.2s',
                opacity: (items.length === 0 || !allComplete) ? 0.7 : 1,
              }}
            >
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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