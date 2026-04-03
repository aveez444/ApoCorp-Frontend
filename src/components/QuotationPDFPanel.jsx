// src/components/QuotationPDFPanel.jsx
//
// Usage in QuotationExternalDetail.jsx (header button row):
//
//   <QuotationPDFPanel
//     quotationId={quotation.id}
//     quotationNumber={quotation.quotation_number}
//     reviewStatus={quotation.review_status}
//     clientStatus={quotation.client_status}          ← NEW prop
//     customerEmail={quotation.customer_detail?.email || ''}
//     customerName={quotation.customer_detail?.company_name || ''}
//   />
//
// The panel now renders as INLINE BUTTONS (no card wrapper) so it
// sits naturally alongside Print / Edit Quotation in the header row.

import { useState, useEffect } from 'react'

const PRIMARY = '#122C41'
const FONT    = "'Lato', 'Inter', 'Segoe UI', sans-serif"
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

// ── Helpers ───────────────────────────────────────────────────────────────────

function getPdfUrl(id, download = false) {
  return `${BASE_URL}/documents/quotation/${id}/pdf/${download ? '?download=true' : ''}`
}

function getAuthHeaders() {
  const token    = localStorage.getItem('access_token')
  const tenantId = localStorage.getItem('tenant_id')
  const h        = {}
  if (token)    h['Authorization'] = `Bearer ${token}`
  if (tenantId) h['x-tenant-id']  = tenantId
  return h
}

async function fetchPdfBlob(quotationId, download = false) {
  const res = await fetch(getPdfUrl(quotationId, download), { headers: getAuthHeaders() })
  if (!res.ok) throw new Error(`Server returned ${res.status}`)
  return res.blob()
}

// Downloads PDF and returns the local blob URL (caller must revoke when done)
async function downloadPdf(quotationId, quotationNumber) {
  const blob = await fetchPdfBlob(quotationId, true)
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `Quotation_${quotationNumber}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  // keep URL alive briefly so the browser can read it
  setTimeout(() => URL.revokeObjectURL(url), 3000)
}

// Opens the default mail app via mailto: without navigating away.
// Using an <a> click is more reliable than window.location.href — it
// avoids the "canceled" network entry you see in DevTools.
function openMailto(to, cc, subject, body) {
  const params = new URLSearchParams()
  if (cc.trim())      params.append('cc',      cc.trim())
  if (subject.trim()) params.append('subject', subject.trim())
  if (body.trim())    params.append('body',    body.trim())

  const href = `mailto:${encodeURIComponent(to.trim())}?${params.toString()}`
  const a    = document.createElement('a')
  a.href     = href
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

// ── Spinner ───────────────────────────────────────────────────────────────────

function Spinner({ size = 14, color = '#fff' }) {
  return (
    <>
      <style>{`@keyframes qpdf-spin{to{transform:rotate(360deg)}}`}</style>
      <span style={{
        display: 'inline-block', width: size, height: size,
        border: `2px solid rgba(255,255,255,0.3)`,
        borderTopColor: color, borderRadius: '50%',
        animation: 'qpdf-spin 0.7s linear infinite', flexShrink: 0,
      }} />
    </>
  )
}

// ── PDF Preview Modal ─────────────────────────────────────────────────────────

function PDFPreviewModal({ quotationId, quotationNumber, onClose }) {
  const [blobUrl,     setBlobUrl]     = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    let objectUrl = null
    fetchPdfBlob(quotationId)
      .then(blob => { objectUrl = URL.createObjectURL(blob); setBlobUrl(objectUrl) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [quotationId])

  const handleDownload = async () => {
    setDownloading(true)
    try {
      await downloadPdf(quotationId, quotationNumber)
    } catch (e) { alert('Download failed: ' + e.message) }
    finally { setDownloading(false) }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,0.75)',
      display: 'flex', flexDirection: 'column', backdropFilter: 'blur(4px)',
    }}>
      {/* Header */}
      <div style={{
        background: PRIMARY, color: '#fff', flexShrink: 0,
        padding: '12px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
          </svg>
          <span style={{ fontSize: 15, fontWeight: 700, fontFamily: FONT }}>
            {quotationNumber} — Preview
          </span>
          {loading && <Spinner size={13} color="rgba(255,255,255,0.7)" />}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleDownload} disabled={!blobUrl || downloading} style={{
            background: '#16a34a', color: '#fff', border: 'none',
            padding: '7px 16px', borderRadius: 7, fontSize: 12, fontWeight: 600,
            cursor: (!blobUrl || downloading) ? 'not-allowed' : 'pointer',
            fontFamily: FONT, display: 'inline-flex', alignItems: 'center', gap: 6,
            opacity: (!blobUrl || downloading) ? 0.6 : 1,
          }}>
            {downloading ? <Spinner size={12} /> : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
              </svg>
            )}
            {downloading ? 'Downloading…' : 'Download'}
          </button>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.15)', color: '#fff',
            border: '1px solid rgba(255,255,255,0.3)',
            padding: '7px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600,
            cursor: 'pointer', fontFamily: FONT,
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
            Close
          </button>
        </div>
      </div>

      {/* PDF area */}
      <div style={{ flex: 1, overflow: 'hidden', background: '#404040' }}>
        {loading && !error && (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, color: '#fff' }}>
            <div style={{ width: 36, height: 36, border: '3px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', borderRadius: '50%', animation: 'qpdf-spin 0.8s linear infinite' }} />
            <span style={{ fontFamily: FONT, fontSize: 14 }}>Generating PDF…</span>
            <span style={{ fontFamily: FONT, fontSize: 12, opacity: 0.55 }}>May take a few seconds for large quotations</span>
          </div>
        )}
        {error && (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: '#fca5a5', padding: 32 }}>
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <div style={{ fontFamily: FONT, textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>PDF generation failed</div>
              <div style={{ fontSize: 13, opacity: 0.8 }}>{error}</div>
              <div style={{ fontSize: 12, opacity: 0.55, marginTop: 6 }}>Make sure WeasyPrint and PyMuPDF are installed on the server.</div>
            </div>
          </div>
        )}
        {blobUrl && (
          <iframe src={blobUrl} style={{ width: '100%', height: '100%', border: 'none' }} title={`Quotation ${quotationNumber}`} />
        )}
      </div>
    </div>
  )
}

// ── Send via Mail Modal ───────────────────────────────────────────────────────
//
// Two action paths:
//   A) "Open Mail App"           — opens mailto: immediately, no download
//   B) "Download PDF & Open Mail" — downloads first, then opens mailto:
//
// Both paths pre-fill To / CC / Subject / Body in the mail client.
// The user attaches the PDF manually in Outlook (drag from Downloads).

function SendEmailModal({ quotationId, quotationNumber, customerEmail, customerName, clientStatus, onClose }) {
  const alreadySent = ['SENT', 'UNDER_NEGOTIATION', 'ACCEPTED', 'REJECTED_BY_CLIENT'].includes(clientStatus)

  const [toEmail,  setToEmail]  = useState(customerEmail || '')
  const [ccEmail,  setCcEmail]  = useState('')
  const [subject,  setSubject]  = useState(`Quotation ${quotationNumber} — ${customerName}`)
  const [body,     setBody]     = useState(
    `Dear ${customerName || 'Team'},\n\nPlease find attached our quotation ${quotationNumber} for your reference.\n\nKindly review and revert with your valuable feedback.\n\nWarm regards`
  )
  const [step,  setStep]  = useState('compose')   // 'compose' | 'downloading' | 'done'
  const [error, setError] = useState(null)

  const mailFields = { to: toEmail, cc: ccEmail, subject, body }

  const handleOpenMail = () => {
    if (!toEmail.trim()) return
    openMailto(toEmail, ccEmail, subject, body)
    setStep('done')
  }

  const handleDownloadAndOpenMail = async () => {
    if (!toEmail.trim()) return
    setStep('downloading')
    setError(null)
    try {
      await downloadPdf(quotationId, quotationNumber)
      // Small delay to let the download dialog appear before mail client opens
      await new Promise(r => setTimeout(r, 600))
      openMailto(toEmail, ccEmail, subject, body)
      setStep('done')
    } catch (e) {
      setError(e.message)
      setStep('compose')
    }
  }

  const inp = {
    border: '1.5px solid #e2e8f0', borderRadius: 7,
    padding: '9px 12px', fontSize: 13, fontFamily: FONT,
    background: '#fff', color: '#1e293b', width: '100%', boxSizing: 'border-box',
    outline: 'none',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(3px)', fontFamily: FONT,
    }}>
      <div style={{
        background: '#fff', borderRadius: 14, padding: '28px 32px',
        width: 520, boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        maxHeight: '90vh', overflowY: 'auto',
      }}>

        {step === 'done' ? (
          /* ── Success state ── */
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: PRIMARY, margin: '0 0 8px', fontFamily: FONT }}>
              Mail Client Opened
            </h3>
            <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, margin: '0 0 16px', fontFamily: FONT }}>
              Your default mail app opened with the message pre-filled.<br />
              Attach <strong>Quotation_{quotationNumber}.pdf</strong> from your Downloads and hit Send.
            </p>
            <div style={{ padding: '10px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, fontSize: 12, color: '#92400e', marginBottom: 20, textAlign: 'left' }}>
              <strong>💡 Outlook tip:</strong> Drag the PDF from your Downloads folder into the compose window to attach it.
            </div>
            <button onClick={onClose} style={{
              background: PRIMARY, color: '#fff', border: 'none',
              padding: '10px 28px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: FONT,
            }}>Done</button>
          </div>
        ) : (
          /* ── Compose state ── */
          <>
            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: '#eff6ff', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: PRIMARY, margin: 0, fontFamily: FONT }}>
                  {alreadySent ? 'Send Again via Mail' : 'Send via Mail'}
                </h3>
                <p style={{ fontSize: 12, color: '#64748b', margin: 0, fontFamily: FONT }}>{quotationNumber}</p>
              </div>
            </div>

            {/* Info banner */}
            <div style={{ padding: '9px 12px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, fontSize: 12, color: '#0369a1', marginBottom: 18, lineHeight: 1.5 }}>
              Fill in the details below, then choose how to proceed. The PDF must be attached manually in your mail client.
            </div>

            {/* Already-sent notice */}
            {alreadySent && (
              <div style={{ padding: '8px 12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 7, fontSize: 12, color: '#92400e', marginBottom: 14 }}>
                This quotation was already sent. You can resend it — for example if the client lost the document.
              </div>
            )}

            {/* Form fields */}
            {[
              ['To *',           toEmail,  setToEmail,  'customer@example.com'],
              ['CC (optional)',  ccEmail,  setCcEmail,  'manager@company.com'],
              ['Subject',        subject,  setSubject,  ''],
            ].map(([label, val, setter, ph]) => (
              <div key={label} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5, fontFamily: FONT }}>{label}</label>
                <input
                  value={val}
                  onChange={e => setter(e.target.value)}
                  placeholder={ph}
                  style={inp}
                  onFocus={e => e.target.style.borderColor = PRIMARY}
                  onBlur={e  => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
            ))}

            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5, fontFamily: FONT }}>Message Body</label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={5}
                style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }}
                onFocus={e => e.target.style.borderColor = PRIMARY}
                onBlur={e  => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            {error && (
              <div style={{ padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 7, fontSize: 12, color: '#dc2626', marginBottom: 14 }}>
                {error}
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>

              {/* Cancel */}
              <button
                onClick={onClose}
                style={{
                  border: '1.5px solid #e2e8f0', background: '#fff', color: '#374151',
                  padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', fontFamily: FONT,
                }}
              >
                Cancel
              </button>

              {/* Open Mail App — no download */}
              <button
                onClick={handleOpenMail}
                disabled={!toEmail.trim() || step === 'downloading'}
                style={{
                  border: '1.5px solid #2563eb', background: '#eff6ff', color: '#2563eb',
                  padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  cursor: (!toEmail.trim() || step === 'downloading') ? 'not-allowed' : 'pointer',
                  fontFamily: FONT, display: 'inline-flex', alignItems: 'center', gap: 7,
                  opacity: (!toEmail.trim() || step === 'downloading') ? 0.5 : 1,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                Open Mail App
              </button>

              {/* Download PDF & Open Mail */}
              <button
                onClick={handleDownloadAndOpenMail}
                disabled={!toEmail.trim() || step === 'downloading'}
                style={{
                  background: PRIMARY, color: '#fff', border: 'none',
                  padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  cursor: (!toEmail.trim() || step === 'downloading') ? 'not-allowed' : 'pointer',
                  fontFamily: FONT, display: 'inline-flex', alignItems: 'center', gap: 7,
                  opacity: (!toEmail.trim() || step === 'downloading') ? 0.5 : 1,
                }}
              >
                {step === 'downloading' ? (
                  <><Spinner size={13} /> Downloading…</>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                    </svg>
                    Download &amp; Open Mail
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Main exported component ───────────────────────────────────────────────────
//
// Renders as three inline icon-buttons (no card/panel wrapper) so they
// sit naturally in the header action row beside Print / Edit Quotation.

export default function QuotationPDFPanel({
  quotationId,
  quotationNumber,
  reviewStatus,
  clientStatus  = 'DRAFT',
  customerEmail = '',
  customerName  = '',
}) {
  const [previewOpen, setPreviewOpen] = useState(false)
  const [emailOpen,   setEmailOpen]   = useState(false)
  const [downloading, setDownloading] = useState(false)

  const handleDirectDownload = async () => {
    if (downloading) return
    setDownloading(true)
    try {
      await downloadPdf(quotationId, quotationNumber)
    } catch (e) {
      alert('Download failed: ' + e.message)
    } finally {
      setDownloading(false)
    }
  }

  // Matches the outline button style used in QuotationExternalDetail
  const outlineBtn = {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '9px 18px',
    border: '1px solid #d1d5db', borderRadius: 7,
    background: '#fff', fontSize: '13px', fontWeight: 600,
    cursor: 'pointer', color: '#374151', fontFamily: FONT,
  }

  // Whether this is a re-send situation
  const alreadySent = ['SENT', 'UNDER_NEGOTIATION', 'ACCEPTED', 'REJECTED_BY_CLIENT'].includes(clientStatus)

  return (
    <>
      <style>{`@keyframes qpdf-spin{to{transform:rotate(360deg)}}`}</style>

      {/* ── Inline buttons — no card wrapper ── */}

      {/* Preview */}
      <button
        onClick={() => setPreviewOpen(true)}
        style={outlineBtn}
        title="Preview PDF"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
        </svg>
        Preview PDF
      </button>

      {/* Download PDF */}
      <button
        onClick={handleDirectDownload}
        disabled={downloading}
        style={{ ...outlineBtn, opacity: downloading ? 0.65 : 1, cursor: downloading ? 'not-allowed' : 'pointer' }}
        title="Download PDF"
      >
        {downloading
          ? <Spinner size={13} color="#374151" />
          : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
            </svg>
          )
        }
        {downloading ? 'Downloading…' : 'Download PDF'}
      </button>

      {/* Send via Mail */}
      <button
        onClick={() => setEmailOpen(true)}
        style={{ ...outlineBtn, borderColor: '#bfdbfe', color: '#2563eb', background: '#eff6ff' }}
        title={alreadySent ? 'Resend quotation via mail' : 'Send quotation via mail'}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
          <polyline points="22,6 12,13 2,6"/>
        </svg>
        {alreadySent ? 'Send Again' : 'Send via Mail'}
      </button>

      {/* Modals */}
      {previewOpen && (
        <PDFPreviewModal
          quotationId={quotationId}
          quotationNumber={quotationNumber}
          onClose={() => setPreviewOpen(false)}
        />
      )}
      {emailOpen && (
        <SendEmailModal
          quotationId={quotationId}
          quotationNumber={quotationNumber}
          customerEmail={customerEmail}
          customerName={customerName}
          clientStatus={clientStatus}
          onClose={() => setEmailOpen(false)}
        />
      )}
    </>
  )
}