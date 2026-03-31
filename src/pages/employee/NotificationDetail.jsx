import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../api/axios'

const PRIMARY = '#1a1a2e'
const GRAY = '#6c757d'

const TYPE_CONFIG = {
  INFO:    { color: '#2b6cb0', bg: '#ebf4ff', label: 'Info', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z' },
  SUCCESS: { color: '#2f855a', bg: '#e6f7ed', label: 'Success', icon: 'M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z' },
  WARNING: { color: '#c05621', bg: '#ffefdb', label: 'Warning', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
  ALERT:   { color: '#c53030', bg: '#fee2e2', label: 'Alert', icon: 'M12 8v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z' },
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// Helper function to detect if a string is a valid URL
function isValidUrl(string) {
  try {
    // Check if it has a protocol
    if (string.includes('://')) {
      new URL(string)
      return true
    }
    // Check for common TLDs or domains without protocol
    const urlPattern = /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(\/.*)?$|^localhost(:\d+)?(\/.*)?$|^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?(\/.*)?$/
    return urlPattern.test(string)
  } catch {
    return false
  }
}

export default function NotificationDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [notif, setNotif] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const r = await api.get(`/notifications/${id}/`)
        setNotif(r.data)
        const isUnread = !r.data.recipients?.[0]?.is_read
        if (isUnread) {
          await api.post(`/notifications/${id}/mark_read/`).catch(() => {})
        }
      } catch {
        navigate('/employee/notifications')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, navigate])

  const handleLinkClick = () => {
    if (!notif?.link) return
    
    // Clean the link
    let cleanLink = notif.link.trim()
    
    // Check if it's an external URL (has protocol)
    if (cleanLink.startsWith('http://') || cleanLink.startsWith('https://')) {
      window.open(cleanLink, '_blank', 'noopener noreferrer')
      return
    }
    
    // Check if it's a domain without protocol (like oringandseal.com)
    if (isValidUrl(cleanLink)) {
      // Add https:// and open in new tab
      window.open(`https://${cleanLink}`, '_blank', 'noopener noreferrer')
      return
    }
    
    // Check if it's a relative path (starts with /)
    if (cleanLink.startsWith('/')) {
      const path = cleanLink.substring(1)
      navigate(`/${path}`)
      return
    }
    
    // If it doesn't match any pattern, try as internal route
    // But check if it's likely a URL by looking for dots
    if (cleanLink.includes('.') && !cleanLink.includes(' ')) {
      // It probably is a URL missing protocol
      const confirmOpen = window.confirm(`"${cleanLink}" appears to be a website. Open it in a new tab?`)
      if (confirmOpen) {
        window.open(`https://${cleanLink}`, '_blank', 'noopener noreferrer')
      }
    } else {
      // Treat as internal route
      navigate(`/${cleanLink}`)
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <div style={{ width: 24, height: 24, border: `2px solid #e2e8f0`, borderTopColor: PRIMARY, borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (!notif) return null

  const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.INFO
  const isExternalLink = notif.link && (notif.link.startsWith('http://') || notif.link.startsWith('https://') || isValidUrl(notif.link.trim()))

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', maxWidth: 720, margin: '0 auto' }}>
      {/* Back button */}
      <button onClick={() => navigate('/employee/notifications')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 20, background: 'none', border: 'none', cursor: 'pointer', color: GRAY, fontSize: 13, fontWeight: 500, padding: '6px 0' }}>
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Back to Notifications
      </button>

      {/* Card */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '24px 28px', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke={cfg.color} strokeWidth={2}>
                <path d={cfg.icon} strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <span style={{ fontSize: 11, fontWeight: 600, color: cfg.color, background: cfg.bg, padding: '2px 8px', borderRadius: 4 }}>
                {cfg.label}
              </span>
            </div>
          </div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: PRIMARY }}>{notif.title}</h1>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 28px' }}>
          <p style={{ margin: 0, fontSize: 14, color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {notif.message}
          </p>

          {/* Link Section */}
          {notif.link && notif.link.trim() !== '' && (
            <div style={{ 
              marginTop: 24, 
              padding: '14px 16px', 
              background: '#f8fafc', 
              borderRadius: 8, 
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={cfg.color} strokeWidth={2}>
                  <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.102m1.858-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span style={{ fontSize: 12.5, color: GRAY }}>
                  {isExternalLink ? 'External link:' : 'Related page:'}
                </span>
              </div>
              <button 
                onClick={handleLinkClick}
                style={{ 
                  fontSize: 12.5, 
                  color: cfg.color, 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer', 
                  fontWeight: 500, 
                  padding: '6px 12px',
                  borderRadius: 6,
                  background: `${cfg.color}10`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                {notif.link.length > 40 ? notif.link.substring(0, 40) + '...' : notif.link}
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  {isExternalLink ? (
                    <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" strokeLinecap="round" strokeLinejoin="round"/>
                  ) : (
                    <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                  )}
                </svg>
              </button>
            </div>
          )}

          {/* Meta grid */}
          <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ padding: '12px 0', borderTop: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: GRAY, marginBottom: 4 }}>Received</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: PRIMARY }}>{formatDate(notif.created_at)}</div>
            </div>
            <div style={{ padding: '12px 0', borderTop: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: GRAY, marginBottom: 4 }}>Status</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: PRIMARY }}>{notif.recipients?.[0]?.is_read ? 'Read' : 'Unread'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}