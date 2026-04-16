// src/components/reports/reportConstants.js
export const PRIMARY = '#122C41'
export const BORDER = '#e2e8f0'
export const FONT = "'Inter', 'Segoe UI', sans-serif"

export function fmt(n) { 
  return new Intl.NumberFormat('en-IN').format(n ?? 0) 
}

export const MODULE_META = {
  enquiry:   { color: '#3b82f6', bg: '#eff6ff', label: 'Enquiries' },
  customer:  { color: '#10b981', bg: '#f0fdf4', label: 'Customers' },
  quotation: { color: '#f59e0b', bg: '#fffbeb', label: 'Quotations' },
  oa:        { color: '#8b5cf6', bg: '#f5f3ff', label: 'Order Acknowledgements' },
  proforma:  { color: '#ef4444', bg: '#fef2f2', label: 'Proforma Invoices' },
}

export const TYPE_OPERATOR_MAP = {
  str:      [{ v: 'eq', l: 'Equals' }, { v: 'neq', l: 'Not equals' }, { v: 'contains', l: 'Contains' }, { v: 'isnull', l: 'Is empty' }],
  int:      [{ v: 'eq', l: 'Equals' }, { v: 'gte', l: '≥' }, { v: 'lte', l: '≤' }],
  decimal:  [{ v: 'eq', l: 'Equals' }, { v: 'gte', l: '≥' }, { v: 'lte', l: '≤' }],
  date:     [{ v: 'eq', l: 'On' }, { v: 'gte', l: 'After' }, { v: 'lte', l: 'Before' }],
  datetime: [{ v: 'gte', l: 'After' }, { v: 'lte', l: 'Before' }],
  bool:     [{ v: 'eq', l: 'Is' }],
  choice:   [{ v: 'eq', l: 'Equals' }, { v: 'neq', l: 'Not equals' }, { v: 'in', l: 'Is one of' }],
}

export const ICONS = {
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
  columns:  'M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z',
  sort:     'M3 6h18M6 12h12M10 18h4',
  print:    'M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z',
}

export const selectStyle = {
  border: `1.5px solid ${BORDER}`,
  borderRadius: 7,
  padding: '8px 10px',
  fontSize: 12,
  fontFamily: FONT,
  background: '#fff',
  color: '#1e293b',
  outline: 'none',
  width: '100%',
  cursor: 'pointer',
  boxSizing: 'border-box',
}

export const inputStyle = {
  border: `1.5px solid ${BORDER}`,
  borderRadius: 7,
  padding: '8px 10px',
  fontSize: 12,
  fontFamily: FONT,
  background: '#fff',
  color: '#1e293b',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}

export const btnPrimary = {
  background: PRIMARY,
  color: '#fff',
  border: 'none',
  padding: '10px 18px',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: FONT,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 7,
  transition: 'background 0.15s',
  whiteSpace: 'nowrap',
}

export const btnOutline = {
  border: `1.5px solid ${BORDER}`,
  background: '#fff',
  color: '#374151',
  padding: '9px 18px',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: FONT,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 7,
  transition: 'all 0.15s',
  whiteSpace: 'nowrap',
}

export const btnSuccess = {
  background: '#16a34a',
  color: '#fff',
  border: 'none',
  padding: '10px 18px',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: FONT,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 7,
  transition: 'background 0.15s',
  whiteSpace: 'nowrap',
}