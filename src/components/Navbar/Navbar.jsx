import { useAuth } from '../../auth/AuthContext'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'

const PRIMARY = '#122C41'
const ACCENT  = '#1e88e5'

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
  INFO:    { color: '#1e88e5', bg: '#e3f2fd', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z' },
  SUCCESS: { color: '#16a34a', bg: '#f0fdf4', icon: 'M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z' },
  WARNING: { color: '#f59e0b', bg: '#fffbeb', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
  ALERT:   { color: '#ef4444', bg: '#fef2f2', icon: 'M12 8v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z' },
}

function TypeIcon({ type, size = 14 }) {
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.INFO
  return (
    <div style={{ width: size + 8, height: size + 8, borderRadius: '50%', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke={cfg.color} strokeWidth={2}>
        <path d={cfg.icon} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
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
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 999 }} />

      {/* Panel */}
      <div style={{
        position: 'absolute', top: 'calc(100% + 10px)', right: 0,
        width: 380, maxHeight: 520,
        background: '#fff', borderRadius: 14,
        boxShadow: '0 8px 40px rgba(0,0,0,.14), 0 2px 8px rgba(0,0,0,.08)',
        border: '1px solid #f0f0f0',
        zIndex: 1000, overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        animation: 'dropIn .18s ease',
      }}>
        <style>{`@keyframes dropIn { from { opacity:0; transform:translateY(-8px) } to { opacity:1; transform:none } }`}</style>

        {/* Header */}
        <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: PRIMARY, fontFamily: 'Lato, sans-serif' }}>Notifications</span>
            {unreadCount > 0 && (
              <span style={{ background: '#ef4444', color: '#fff', borderRadius: 99, fontSize: 11, fontWeight: 700, padding: '1px 7px' }}>{unreadCount}</span>
            )}
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} style={{ fontSize: 12, color: ACCENT, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Lato, sans-serif', fontWeight: 600 }}>
              Mark all read
            </button>
          )}
        </div>

        {/* List */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#9ca3af', fontSize: 13, fontFamily: 'Lato, sans-serif' }}>
              <div style={{ width: 18, height: 18, border: '2px solid #e5e7eb', borderTopColor: PRIMARY, borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 10px' }} />
              Loading…
            </div>
          ) : items.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="#d1d5db" strokeWidth={1.5} style={{ margin: '0 auto 10px', display: 'block' }}>
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: '#9ca3af', fontFamily: 'Lato, sans-serif' }}>No notifications yet</p>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#d1d5db', fontFamily: 'Lato, sans-serif' }}>You're all caught up!</p>
            </div>
          ) : items.map(notif => {
            const isUnread = !notif.recipients?.[0]?.is_read
            const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.INFO
            return (
              <div key={notif.id} onClick={() => markRead(notif)}
                style={{
                  padding: '12px 18px', cursor: 'pointer', borderBottom: '1px solid #f9fafb',
                  background: isUnread ? `${cfg.bg}99` : '#fff',
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                  transition: 'background .12s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8faff'}
                onMouseLeave={e => e.currentTarget.style.background = isUnread ? `${cfg.bg}99` : '#fff'}
              >
                <TypeIcon type={notif.type} size={13} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: isUnread ? 700 : 600, color: '#111827', fontFamily: 'Lato, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {notif.title}
                    </span>
                    {isUnread && <span style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />}
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: '#6b7280', fontFamily: 'Lato, sans-serif', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5 }}>
                    {notif.message}
                  </p>
                  <span style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'Lato, sans-serif', marginTop: 4, display: 'block' }}>{timeAgo(notif.created_at)}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div style={{ padding: '10px 18px', borderTop: '1px solid #f3f4f6', flexShrink: 0, textAlign: 'center' }}>
            <button onClick={() => { onClose(); onNavigate('/employee/notifications') }}
              style={{ fontSize: 13, color: ACCENT, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'Lato, sans-serif' }}>
              View all notifications →
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

  useEffect(() => {
    fetchUnreadCount()
    if (!isEmployee) return
    const iv = setInterval(fetchUnreadCount, 30_000)
    return () => clearInterval(iv)
  }, [fetchUnreadCount, isEmployee])

  const handleBellClick = () => {
    if (isEmployee) {
      setShowDropdown(p => !p)
    } else {
      // Manager: bell is a shortcut to the Send Notification page
      navigate('/manager/notifications/send')
    }
  }

  const handleDropdownClose = () => {
    setShowDropdown(false)
    fetchUnreadCount()   // refresh badge after interactions
  }

  return (
    <header style={{
      height: 64, background: '#fff', borderBottom: '1px solid #f0f0f0',
      display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
      padding: '0 24px', gap: 16, flexShrink: 0,
    }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes bellShake {
          0%,100% { transform: rotate(0) }
          15%      { transform: rotate(14deg) }
          30%      { transform: rotate(-10deg) }
          45%      { transform: rotate(6deg) }
          60%      { transform: rotate(-4deg) }
          75%      { transform: rotate(2deg) }
        }
        .bell-btn:hover svg { animation: bellShake .5s ease; }
      `}</style>

      {/* Bell icon */}
      <div ref={bellRef} style={{ position: 'relative' }}>
        <button
          className="bell-btn"
          onClick={handleBellClick}
          title={isEmployee ? 'Notifications' : 'Send Notification'}
          style={{
            width: 38, height: 38, borderRadius: '50%',
            background: showDropdown ? '#e8f0fe' : '#f1f5f9',
            border: `1.5px solid ${showDropdown ? ACCENT + '44' : 'transparent'}`,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: showDropdown ? ACCENT : '#475569',
            position: 'relative', flexShrink: 0,
            transition: 'background .15s, color .15s',
          }}>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>

          {/* Unread badge */}
          {isEmployee && unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: -3, right: -3,
              background: '#ef4444', color: '#fff',
              borderRadius: '50%', minWidth: 17, height: 17,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 700, border: '2px solid #fff',
              fontFamily: 'Lato, sans-serif', lineHeight: 1,
              padding: '0 2px',
            }}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown */}
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
          background: `linear-gradient(135deg, ${PRIMARY}, #1a4a6e)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 700, fontSize: '0.85rem',
          flexShrink: 0, fontFamily: 'Lato, sans-serif',
          boxShadow: '0 2px 8px rgba(18,44,65,.25)',
        }}>
          {initials}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3 }}>
          <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#0d1b35', fontFamily: 'Lato, sans-serif' }}>
            {user?.username || 'User'}
          </span>
          <span style={{ fontSize: '0.7rem', color: '#9ca3af', fontFamily: 'Lato, sans-serif' }}>
            ID : {user?.tenant_id?.toString().slice(0, 8).toUpperCase() || 'SEDE12'}
          </span>
        </div>
      </div>
    </header>
  )
}