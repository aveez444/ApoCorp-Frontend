// src/components/ProformaPDFPanel.jsx
//
// Usage in ProformaDetail page (header action row):
//
//   <ProformaPDFPanel
//     proformaId={proforma.id}
//     proformaNumber={proforma.proforma_number}
//     status={proforma.status}
//     customerEmail={customer.email || ''}
//     customerName={customer.company_name || ''}
//     onProformaSent={refresh}
//   />
//
// The panel renders as INLINE BUTTONS (no card wrapper) so it
// sits naturally alongside other action buttons.

import { useState, useEffect } from 'react'
import api from '../api/axios'

const PRIMARY = '#122C41'
const FONT = "'Lato', 'Inter', 'Segoe UI', sans-serif"
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

// ── Helpers ───────────────────────────────────────────────────────────────────

function getPdfUrl(id, download = false) {
  return `${BASE_URL}/documents/proforma/${id}/pdf/${download ? '?download=true' : ''}`
}

function getAuthHeaders() {
  const token = localStorage.getItem('access_token')
  const tenantId = localStorage.getItem('tenant_id')
  const h = {}
  if (token) h['Authorization'] = `Bearer ${token}`
  if (tenantId) h['x-tenant-id'] = tenantId
  return h
}

async function fetchPdfBlob(proformaId, download = false) {
  const res = await fetch(getPdfUrl(proformaId, download), { headers: getAuthHeaders() })
  if (!res.ok) throw new Error(`Server returned ${res.status}`)
  return res.blob()
}

// Downloads PDF and returns the local blob URL (caller must revoke when done)
async function downloadPdf(proformaId, proformaNumber) {
  const blob = await fetchPdfBlob(proformaId, true)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Proforma_${proformaNumber}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 3000)
}

// ── Email client helpers ──────────────────────────────────────────────────────

// Build email URL for different providers
function getEmailUrl(provider, to, cc, subject, body) {
  const encodedTo = encodeURIComponent(to.trim())
  const encodedCc = cc.trim() ? `&cc=${encodeURIComponent(cc.trim())}` : ''
  const encodedSubject = subject.trim() ? `&subject=${encodeURIComponent(subject.trim())}` : ''
  const encodedBody = body.trim() ? `&body=${encodeURIComponent(body.trim())}` : ''

  switch (provider) {
    case 'gmail':
      return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodedTo}${encodedCc}${encodedSubject}${encodedBody}`
    case 'outlook':
      return `https://outlook.live.com/mail/0/deeplink/compose?to=${encodedTo}${encodedCc.replace('&cc=', '&cc=')}${encodedSubject.replace('&subject=', '&subject=')}${encodedBody.replace('&body=', '&body=')}`
    case 'yahoo':
      return `https://mail.yahoo.com/d/compose?to=${encodedTo}${encodedCc.replace('&cc=', '&cc=')}${encodedSubject.replace('&subject=', '&subject=')}${encodedBody.replace('&body=', '&body=')}`
    default:
      const params = new URLSearchParams()
      if (to.trim()) params.append('to', to.trim())
      if (cc.trim()) params.append('cc', cc.trim())
      if (subject.trim()) params.append('subject', subject.trim())
      if (body.trim()) params.append('body', body.trim())
      return `mailto:${encodedTo}?${params.toString()}`
  }
}

// Open email provider in new window
function openEmailProvider(provider, to, cc, subject, body) {
  const url = getEmailUrl(provider, to, cc, subject, body)
  window.open(url, '_blank', 'noopener,noreferrer,width=800,height=600')
}

// ── Spinner ───────────────────────────────────────────────────────────────────

function Spinner({ size = 14, color = '#fff' }) {
  return (
    <>
      <style>{`@keyframes propdf-spin{to{transform:rotate(360deg)}}`}</style>
      <span style={{
        display: 'inline-block', width: size, height: size,
        border: `2px solid rgba(255,255,255,0.3)`,
        borderTopColor: color, borderRadius: '50%',
        animation: 'propdf-spin 0.7s linear infinite', flexShrink: 0,
      }} />
    </>
  )
}

// ── PDF Preview Modal ─────────────────────────────────────────────────────────

function PDFPreviewModal({ proformaId, proformaNumber, onClose }) {
  const [blobUrl, setBlobUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    let objectUrl = null
    fetchPdfBlob(proformaId)
      .then(blob => { objectUrl = URL.createObjectURL(blob); setBlobUrl(objectUrl) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [proformaId])

  const handleDownload = async () => {
    setDownloading(true)
    try {
      await downloadPdf(proformaId, proformaNumber)
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
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
          </svg>
          <span style={{ fontSize: 15, fontWeight: 700, fontFamily: FONT }}>
            {proformaNumber} — Preview
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
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
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
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            Close
          </button>
        </div>
      </div>

      {/* PDF area */}
      <div style={{ flex: 1, overflow: 'hidden', background: '#404040' }}>
        {loading && !error && (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, color: '#fff' }}>
            <div style={{ width: 36, height: 36, border: '3px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', borderRadius: '50%', animation: 'propdf-spin 0.8s linear infinite' }} />
            <span style={{ fontFamily: FONT, fontSize: 14 }}>Generating PDF…</span>
            <span style={{ fontFamily: FONT, fontSize: 12, opacity: 0.55 }}>May take a few seconds for large proformas</span>
          </div>
        )}
        {error && (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: '#fca5a5', padding: 32 }}>
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div style={{ fontFamily: FONT, textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>PDF generation failed</div>
              <div style={{ fontSize: 13, opacity: 0.8 }}>{error}</div>
              <div style={{ fontSize: 12, opacity: 0.55, marginTop: 6 }}>Make sure Playwright and PyMuPDF are installed on the server.</div>
            </div>
          </div>
        )}
        {blobUrl && (
          <iframe src={blobUrl} style={{ width: '100%', height: '100%', border: 'none' }} title={`Proforma ${proformaNumber}`} />
        )}
      </div>
    </div>
  )
}

// ── Send via Mail Modal ───────────────────────────────────────────────────────

function SendEmailModal({ proformaId, proformaNumber, customerEmail, customerName, status, onClose, onProformaSent }) {
  const alreadySent = ['SENT', 'PARTIAL', 'PAID'].includes(status)

  const [toEmail, setToEmail] = useState(customerEmail || '')
  const [ccEmail, setCcEmail] = useState('')
  const [subject, setSubject] = useState(`Proforma Invoice ${proformaNumber} — ${customerName}`)
  const [body, setBody] = useState(
    `Dear ${customerName || 'Team'},

Please find attached our proforma invoice ${proformaNumber} for your reference.

Kindly review and arrange payment as per the terms mentioned.

Warm regards`
  )
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [showProviderSelect, setShowProviderSelect] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)

  // Function to call the send API
  const markAsSent = async () => {
    try {
      const response = await api.post(`/proforma/${proformaId}/send/`)
      if (onProformaSent) {
        await onProformaSent() // Refresh the parent component
      }
      return true
    } catch (err) {
      console.error('Failed to mark proforma as sent:', err)
      const errorMsg = err?.response?.data?.error || err?.response?.data?.message || 'Failed to update proforma status'
      setError(errorMsg)
      return false
    }
  }

  const handleOpenEmail = async (provider) => {
    if (!toEmail.trim()) {
      alert('Please enter recipient email address')
      return
    }

    setSending(true)
    setError(null)
    setSelectedProvider(provider)

    // First, mark the proforma as SENT (only if not already sent)
    let shouldProceed = true
    if (!alreadySent) {
      const marked = await markAsSent()
      shouldProceed = marked
    }

    if (shouldProceed) {
      // Open the email client
      openEmailProvider(provider, toEmail, ccEmail, subject, body)
      setShowProviderSelect(false)
    }

    setSending(false)
  }

  const handleBack = () => {
    setShowProviderSelect(true)
    setSelectedProvider(null)
    setError(null)
  }

  const inp = {
    border: '1.5px solid #e2e8f0', borderRadius: 7,
    padding: '9px 12px', fontSize: 13, fontFamily: FONT,
    background: '#fff', color: '#1e293b', width: '100%', boxSizing: 'border-box',
    outline: 'none',
  }

  // Provider selection view
  if (showProviderSelect) {
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
          {/* Modal header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: '#eff6ff', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: PRIMARY, margin: 0, fontFamily: FONT }}>
                {alreadySent ? 'Send Again via Email' : 'Send via Email'}
              </h3>
              <p style={{ fontSize: 12, color: '#64748b', margin: 0, fontFamily: FONT }}>{proformaNumber}</p>
            </div>
          </div>

          {/* Already-sent notice */}
          {alreadySent && (
            <div style={{ padding: '8px 12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 7, fontSize: 12, color: '#92400e', marginBottom: 18 }}>
              This proforma was already sent. You can resend it.
            </div>
          )}

          {/* Error message */}
          {error && (
            <div style={{ padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 7, fontSize: 12, color: '#dc2626', marginBottom: 18 }}>
              {error}
            </div>
          )}

          {/* Form fields */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5, fontFamily: FONT }}>To *</label>
            <input
              value={toEmail}
              onChange={e => setToEmail(e.target.value)}
              placeholder="customer@example.com"
              style={inp}
              onFocus={e => e.target.style.borderColor = PRIMARY}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5, fontFamily: FONT }}>CC (optional)</label>
            <input
              value={ccEmail}
              onChange={e => setCcEmail(e.target.value)}
              placeholder="accounts@company.com"
              style={inp}
              onFocus={e => e.target.style.borderColor = PRIMARY}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5, fontFamily: FONT }}>Subject</label>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              style={inp}
              onFocus={e => e.target.style.borderColor = PRIMARY}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5, fontFamily: FONT }}>Message Body</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={5}
              style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }}
              onFocus={e => e.target.style.borderColor = PRIMARY}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          {/* Choose email provider */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 12, fontFamily: FONT }}>Choose Email Service:</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              <button
                onClick={() => handleOpenEmail('gmail')}
                disabled={sending}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: 8,
                  background: sending ? '#f3f4f6' : '#fff', cursor: sending ? 'not-allowed' : 'pointer',
                  fontFamily: FONT, fontSize: 13, fontWeight: 600, color: '#374151',
                  transition: 'all 0.2s', opacity: sending ? 0.6 : 1
                }}
                onMouseEnter={e => { if (!sending) { e.currentTarget.style.borderColor = '#ea4335'; e.currentTarget.style.background = '#fef2f0' } }}
                onMouseLeave={e => { if (!sending) { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#fff' } }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#ea4335" d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2z" />
                  <path fill="#fff" d="M12 6v6l4-2-4-4z" />
                  <path fill="#fff" d="M12 6v6l-4-2 4-4z" />
                  <path fill="#34a853" d="M12 18c-2.5 0-4.6-1.5-5.5-3.6l2.5-1.5c.6 1.2 1.8 2 3 2 2 0 3.5-1.5 3.5-3.5S14 8 12 8c-1.2 0-2.4.8-3 2L6.5 8.5C7.4 6.5 9.5 5 12 5c3.3 0 6 2.7 6 6s-2.7 6-6 6z" />
                </svg>
                Gmail
              </button>
              <button
                onClick={() => handleOpenEmail('outlook')}
                disabled={sending}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: 8,
                  background: sending ? '#f3f4f6' : '#fff', cursor: sending ? 'not-allowed' : 'pointer',
                  fontFamily: FONT, fontSize: 13, fontWeight: 600, color: '#374151',
                  transition: 'all 0.2s', opacity: sending ? 0.6 : 1
                }}
                onMouseEnter={e => { if (!sending) { e.currentTarget.style.borderColor = '#0078d4'; e.currentTarget.style.background = '#f0f7ff' } }}
                onMouseLeave={e => { if (!sending) { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#fff' } }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#0078d4">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                  <path d="M12 7v5l3.5 2-3.5-2V7z" />
                </svg>
                Outlook
              </button>
              <button
                onClick={() => handleOpenEmail('yahoo')}
                disabled={sending}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: 8,
                  background: sending ? '#f3f4f6' : '#fff', cursor: sending ? 'not-allowed' : 'pointer',
                  fontFamily: FONT, fontSize: 13, fontWeight: 600, color: '#374151',
                  transition: 'all 0.2s', opacity: sending ? 0.6 : 1
                }}
                onMouseEnter={e => { if (!sending) { e.currentTarget.style.borderColor = '#6001d2'; e.currentTarget.style.background = '#f5f0ff' } }}
                onMouseLeave={e => { if (!sending) { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#fff' } }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#6001d2">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                </svg>
                Yahoo Mail
              </button>
              <button
                onClick={() => handleOpenEmail('default')}
                disabled={sending}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: 8,
                  background: sending ? '#f3f4f6' : '#fff', cursor: sending ? 'not-allowed' : 'pointer',
                  fontFamily: FONT, fontSize: 13, fontWeight: 600, color: '#374151',
                  transition: 'all 0.2s', opacity: sending ? 0.6 : 1
                }}
                onMouseEnter={e => { if (!sending) { e.currentTarget.style.borderColor = '#6b7280'; e.currentTarget.style.background = '#f9fafb' } }}
                onMouseLeave={e => { if (!sending) { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#fff' } }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                Default Mail App
              </button>
            </div>
          </div>

          <div style={{ padding: '12px 14px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, fontSize: 12, color: '#0369a1', marginBottom: 20, lineHeight: 1.5 }}>
            <strong>💡 Tip:</strong> Your email will open in a new tab/window. You'll need to manually attach the PDF from your Downloads folder.
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              onClick={onClose}
              disabled={sending}
              style={{
                border: '1.5px solid #e2e8f0', background: '#fff', color: '#374151',
                padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                cursor: sending ? 'not-allowed' : 'pointer', fontFamily: FONT,
                opacity: sending ? 0.5 : 1
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Success view after opening email
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(3px)', fontFamily: FONT,
    }}>
      <div style={{
        background: '#fff', borderRadius: 14, padding: '28px 32px',
        width: 450, boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: PRIMARY, margin: '0 0 12px', fontFamily: FONT }}>
          Email Client Opened
        </h3>
        <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, margin: '0 0 20px', fontFamily: FONT }}>
          {!alreadySent && (
            <span style={{ display: 'block', marginBottom: 12, color: '#43A047' }}>
              ✓ Proforma marked as SENT successfully!
            </span>
          )}
          Your email has been opened with the recipient, subject, and message pre-filled.<br /><br />
          <strong>Don't forget to attach the PDF file:</strong><br />
          Download the PDF first using the "Download PDF" button, then attach it to your email.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button
            onClick={handleBack}
            style={{
              border: '1.5px solid #e2e8f0', background: '#fff', color: '#374151',
              padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: FONT,
            }}
          >
            Back
          </button>
          <button
            onClick={onClose}
            style={{
              background: PRIMARY, color: '#fff', border: 'none',
              padding: '9px 28px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: FONT,
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main exported component ───────────────────────────────────────────────────
//
// Renders as three inline icon-buttons (no card/panel wrapper)

export default function ProformaPDFPanel({
  proformaId,
  proformaNumber,
  status = 'DRAFT',
  customerEmail = '',
  customerName = '',
  onProformaSent,
}) {
  const [previewOpen, setPreviewOpen] = useState(false)
  const [emailOpen, setEmailOpen] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const handleDirectDownload = async () => {
    if (downloading) return
    setDownloading(true)
    try {
      await downloadPdf(proformaId, proformaNumber)
    } catch (e) {
      alert('Download failed: ' + e.message)
    } finally {
      setDownloading(false)
    }
  }

  const outlineBtn = {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '9px 18px',
    border: '1px solid #d1d5db', borderRadius: 7,
    background: '#fff', fontSize: '13px', fontWeight: 600,
    cursor: 'pointer', color: '#374151', fontFamily: FONT,
  }

  const alreadySent = ['SENT', 'PARTIAL', 'PAID'].includes(status)

  return (
    <>
      <style>{`@keyframes propdf-spin{to{transform:rotate(360deg)}}`}</style>

      {/* Preview PDF */}
      <button
        onClick={() => setPreviewOpen(true)}
        style={outlineBtn}
        title="Preview PDF"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
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
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
          )
        }
        {downloading ? 'Downloading…' : 'Download PDF'}
      </button>

      {/* Send via Mail */}
      <button
        onClick={() => setEmailOpen(true)}
        style={{ ...outlineBtn, borderColor: '#bfdbfe', color: '#2563eb', background: '#eff6ff' }}
        title={alreadySent ? 'Resend proforma via mail' : 'Send proforma via mail'}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
        {alreadySent ? 'Send Again' : 'Send via Mail'}
      </button>

      {/* Modals */}
      {previewOpen && (
        <PDFPreviewModal
          proformaId={proformaId}
          proformaNumber={proformaNumber}
          onClose={() => setPreviewOpen(false)}
        />
      )}
      {emailOpen && (
        <SendEmailModal
          proformaId={proformaId}
          proformaNumber={proformaNumber}
          customerEmail={customerEmail}
          customerName={customerName}
          status={status}
          onClose={() => setEmailOpen(false)}
          onProformaSent={onProformaSent}
        />
      )}
    </>
  )
}