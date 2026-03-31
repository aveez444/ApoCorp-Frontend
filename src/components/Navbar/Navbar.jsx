import { useAuth } from '../../auth/AuthContext'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'

const PRIMARY = '#1a1a2e'
const ACCENT  = '#2d6a4f'
const GRAY    = '#6c757d'

/* ── tiny helpers ──────────────────────────────────────────────── */
function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = (Date.now() - new Date(dateStr)) / 1000
  if (diff < 60)    return 'just now'
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

const TYPE_CONFIG = {
  INFO:    { color: '#2b6cb0', bg: '#ebf4ff', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z' },
  SUCCESS: { color: '#2f855a', bg: '#e6f7ed', icon: 'M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z' },
  WARNING: { color: '#c05621', bg: '#ffefdb', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
  ALERT:   { color: '#c53030', bg: '#fee2e2', icon: 'M12 8v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z' },
}

function TypeIcon({ type, size = 14 }) {
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.INFO
  return (
    <div style={{ width: size + 8, height: size + 8, borderRadius: 6, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke={cfg.color} strokeWidth={2}>
        <path d={cfg.icon} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

// Toast Component
function Toast({ message, type, onClose }) {
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.INFO
  
  useEffect(() => {
    const timer = setTimeout(onClose, 5000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div style={{
      position: 'fixed',
      top: 80,
      right: 24,
      zIndex: 1100,
      animation: 'slideIn 0.3s ease-out'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 8,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        border: `1px solid ${cfg.color}20`,
        borderLeft: `4px solid ${cfg.color}`,
        padding: '12px 16px',
        minWidth: 280,
        maxWidth: 400,
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start'
      }}>
        <TypeIcon type={type} size={16} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e', marginBottom: 2 }}>
            New Notification
          </div>
          <div style={{ fontSize: 12.5, color: '#4a5568', lineHeight: 1.4 }}>
            {message}
          </div>
        </div>
        <button onClick={onClose} style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#a0aec0',
          fontSize: 16,
          padding: '0 4px'
        }}>×</button>
      </div>
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   NOTIFICATION DROPDOWN (employee only)
══════════════════════════════════════════════════════════════ */
function NotificationDropdown({ onClose, onNavigate }) {
  const [items, setItems]       = useState([])
  const [loading, setLoading]   = useState(true)

  const fetchNotifs = useCallback(async () => {
    try {
      const r = await api.get('/notifications/?page_size=10')
      setItems(r.data?.results || r.data || [])
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchNotifs() }, [fetchNotifs])

  const markRead = async (notif) => {
    const recipient = notif.recipients?.[0]
    if (recipient && !recipient.is_read) {
      try { await api.post(`/notifications/${notif.id}/mark_read/`) } catch { /* silent */ }
      setItems(prev => prev.map(n => n.id === notif.id
        ? { ...n, recipients: [{ ...n.recipients[0], is_read: true }] }
        : n
      ))
    }
    onClose()
    onNavigate(`/employee/notifications/${notif.id}`)
  }

  const markAllRead = async () => {
    const unread = items.filter(n => !n.recipients?.[0]?.is_read)
    await Promise.allSettled(unread.map(n => api.post(`/notifications/${n.id}/mark_read/`)))
    setItems(prev => prev.map(n => ({ ...n, recipients: [{ ...n.recipients?.[0], is_read: true }] })))
  }

  const unreadCount = items.filter(n => !n.recipients?.[0]?.is_read).length

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 999 }} />
      <div style={{
        position: 'absolute', top: 'calc(100% + 10px)', right: 0,
        width: 360, maxHeight: 480,
        background: '#fff', borderRadius: 8,
        boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
        border: '1px solid #e2e8f0',
        zIndex: 1000, overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: PRIMARY, fontFamily: 'Inter, system-ui, sans-serif' }}>Notifications</span>
          {unreadCount > 0 && (
            <button onClick={markAllRead} style={{ fontSize: 12, color: ACCENT, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
              Mark all read
            </button>
          )}
        </div>

        {/* List */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ padding: 32, textAlign: 'center', color: GRAY, fontSize: 13 }}>
              <div style={{ width: 18, height: 18, border: '2px solid #e2e8f0', borderTopColor: PRIMARY, borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 10px' }} />
              Loading...
            </div>
          ) : items.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: 13.5, fontWeight: 500, color: GRAY }}>No notifications yet</p>
            </div>
          ) : items.map(notif => {
            const isUnread = !notif.recipients?.[0]?.is_read
            const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.INFO
            return (
              <div key={notif.id} onClick={() => markRead(notif)}
                style={{
                  padding: '12px 18px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9',
                  background: isUnread ? '#fafbfc' : '#fff',
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                }}>
                <TypeIcon type={notif.type} size={13} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: isUnread ? 600 : 500, color: '#1a1a2e', marginBottom: 3 }}>
                    {notif.title}
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: GRAY, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {notif.message}
                  </p>
                  <span style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, display: 'block' }}>{timeAgo(notif.created_at)}</span>
                </div>
              </div>
            )
          })}
        </div>

        {items.length > 0 && (
          <div style={{ padding: '10px 18px', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
            <button onClick={() => { onClose(); onNavigate('/employee/notifications') }}
              style={{ fontSize: 12.5, color: ACCENT, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
              View all →
            </button>
          </div>
        )}
      </div>
    </>
  )
}

/* ══════════════════════════════════════════════════════════════
   MAIN NAVBAR
══════════════════════════════════════════════════════════════ */
export default function Navbar() {
  const { user }    = useAuth()
  const navigate    = useNavigate()
  const bellRef     = useRef(null)

  const [showDropdown, setShowDropdown] = useState(false)
  const [unreadCount, setUnreadCount]   = useState(0)
  const [toast, setToast]               = useState(null)

  const isEmployee = user?.role === 'employee'

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : 'U'

  // Poll unread count every 30s (employees only)
  const fetchUnreadCount = useCallback(async () => {
    if (!isEmployee) return
    try {
      const r = await api.get('/notifications/unread_count/')
      setUnreadCount(r.data?.unread_count ?? 0)
    } catch { /* silent */ }
  }, [isEmployee])

  // Poll for new notifications (toast for employees)
  const checkNewNotifications = useCallback(async () => {
    if (!isEmployee) return
    try {
      const r = await api.get('/notifications/?page_size=1')
      const latest = r.data?.results?.[0] || r.data?.[0]
      if (latest) {
        const lastShown = sessionStorage.getItem('last_notification_id')
        if (lastShown !== String(latest.id)) {
          const isUnread = !latest.recipients?.[0]?.is_read
          if (isUnread) {
            setToast({ message: latest.title, type: latest.type })
            sessionStorage.setItem('last_notification_id', latest.id)
          }
        }
      }
    } catch { /* silent */ }
  }, [isEmployee])

  useEffect(() => {
    fetchUnreadCount()
    if (!isEmployee) return
    const interval = setInterval(() => {
      fetchUnreadCount()
      checkNewNotifications()
    }, 15000)
    return () => clearInterval(interval)
  }, [fetchUnreadCount, checkNewNotifications, isEmployee])

  const handleBellClick = () => {
    if (isEmployee) {
      setShowDropdown(p => !p)
    } else {
      navigate('/manager/notifications/send')
    }
  }

  const handleDropdownClose = () => {
    setShowDropdown(false)
    fetchUnreadCount()
  }

  return (
    <header style={{
      height: 64, background: '#fff', borderBottom: '1px solid #e2e8f0',
      display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
      padding: '0 24px', gap: 16, flexShrink: 0,
    }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes bellShake {
          0%,100% { transform: rotate(0) }
          15% { transform: rotate(14deg) }
          30% { transform: rotate(-10deg) }
          45% { transform: rotate(6deg) }
          60% { transform: rotate(-4deg) }
          75% { transform: rotate(2deg) }
        }
        .bell-btn:hover svg { animation: bellShake .5s ease; }
      `}</style>

      {/* Toast */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Bell icon */}
      <div ref={bellRef} style={{ position: 'relative' }}>
        <button
          className="bell-btn"
          onClick={handleBellClick}
          title={isEmployee ? 'Notifications' : 'Send Notification'}
          style={{
            width: 38, height: 38, borderRadius: '50%',
            background: showDropdown ? '#f1f5f9' : '#f8fafc',
            border: 'none',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: showDropdown ? ACCENT : '#475569',
            position: 'relative', flexShrink: 0,
            transition: 'background .15s',
          }}>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>

          {isEmployee && unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: -2, right: -2,
              background: '#dc2626', color: '#fff',
              borderRadius: '50%', minWidth: 16, height: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, fontWeight: 600, border: '2px solid #fff',
              padding: '0 2px',
            }}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {showDropdown && isEmployee && (
          <NotificationDropdown
            onClose={handleDropdownClose}
            onNavigate={navigate}
          />
        )}
      </div>

      {/* User avatar + info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 38, height: 38, borderRadius: '50%',
          background: `linear-gradient(135deg, ${PRIMARY}, #2d3748)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 600, fontSize: '0.85rem',
          flexShrink: 0, fontFamily: 'Inter, system-ui, sans-serif',
        }}>
          {initials}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3 }}>
          <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1a1a2e' }}>
            {user?.username || 'User'}
          </span>
          <span style={{ fontSize: '0.7rem', color: GRAY }}>
            ID: {user?.tenant_id?.toString().slice(0, 8).toUpperCase() || 'EMP001'}
          </span>
        </div>
      </div>
    </header>
  )
}
