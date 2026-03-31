import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'

const PRIMARY = '#1a1a2e'
const ACCENT = '#2d6a4f'
const GRAY = '#6c757d'

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = (Date.now() - new Date(dateStr)) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

const TYPE_CONFIG = {
  INFO:    { color: '#2b6cb0', bg: '#ebf4ff', label: 'Info', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z' },
  SUCCESS: { color: '#2f855a', bg: '#e6f7ed', label: 'Success', icon: 'M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z' },
  WARNING: { color: '#c05621', bg: '#ffefdb', label: 'Warning', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
  ALERT:   { color: '#c53030', bg: '#fee2e2', label: 'Alert', icon: 'M12 8v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z' },
}

const FILTERS = ['All', 'Unread', 'Info', 'Success', 'Warning', 'Alert']

function TypeBadge({ type }) {
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.INFO
  return (
    <span style={{ fontSize: 11, fontWeight: 500, color: cfg.color, background: cfg.bg, padding: '2px 8px', borderRadius: 4 }}>
      {cfg.label}
    </span>
  )
}

export default function NotificationsPage() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const r = await api.get('/notifications/')
      setNotifications(r.data?.results || r.data || [])
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const markRead = async (notif) => {
    const isUnread = !notif.recipients?.[0]?.is_read
    if (isUnread) {
      try { await api.post(`/notifications/${notif.id}/mark_read/`) } catch { /* silent */ }
      setNotifications(prev => prev.map(n => n.id === notif.id
        ? { ...n, recipients: [{ ...n.recipients[0], is_read: true }] }
        : n
      ))
    }
    navigate(`/employee/notifications/${notif.id}`)
  }

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.recipients?.[0]?.is_read)
    await Promise.allSettled(unread.map(n => api.post(`/notifications/${n.id}/mark_read/`)))
    setNotifications(prev => prev.map(n => ({ ...n, recipients: [{ ...n.recipients?.[0], is_read: true }] })))
  }

  const filtered = notifications.filter(n => {
    const typeLabel = TYPE_CONFIG[n.type]?.label || n.type
    const matchFilter =
      filter === 'All' ? true :
      filter === 'Unread' ? !n.recipients?.[0]?.is_read :
      typeLabel === filter
    const matchSearch = !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.message.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const unreadCount = notifications.filter(n => !n.recipients?.[0]?.is_read).length

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', maxWidth: 900, margin: '0 auto' }}>
      {/* Back Button */}
      <button 
        onClick={() => navigate('/employee/dashboard')}
        style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: 6, 
          marginBottom: 20, 
          background: 'none', 
          border: 'none', 
          cursor: 'pointer', 
          color: GRAY, 
          fontSize: 13, 
          fontWeight: 500, 
          padding: '6px 0',
          transition: 'color 0.2s'
        }}
        onMouseEnter={e => e.currentTarget.style.color = PRIMARY}
        onMouseLeave={e => e.currentTarget.style.color = GRAY}>
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Back to Dashboard
      </button>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: PRIMARY }}>Notifications</h1>
          {unreadCount > 0 && (
            <button onClick={markAllRead}
              style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
              Mark all read
            </button>
          )}
        </div>
        <p style={{ margin: 0, fontSize: 13, color: GRAY }}>{notifications.length} total</p>
      </div>

      {/* Filters + Search */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '6px 14px', borderRadius: 6, border: filter === f ? `1px solid ${ACCENT}` : '1px solid #e2e8f0', background: filter === f ? ACCENT : '#fff', color: filter === f ? '#fff' : PRIMARY, fontSize: 12.5, fontWeight: 500, cursor: 'pointer' }}>
              {f}
              {f === 'Unread' && unreadCount > 0 && <span style={{ marginLeft: 4 }}>({unreadCount})</span>}
            </button>
          ))}
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
          style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12.5, width: 200 }} />
      </div>

      {/* List */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: GRAY }}>
            <div style={{ width: 22, height: 22, border: '2px solid #e2e8f0', borderTopColor: PRIMARY, borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 12px' }} />
            Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 13, color: GRAY }}>No notifications found</p>
          </div>
        ) : filtered.map((notif, i) => {
          const isUnread = !notif.recipients?.[0]?.is_read
          const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.INFO
          return (
            <div key={notif.id} onClick={() => markRead(notif)}
              style={{
                padding: '16px 20px',
                cursor: 'pointer',
                borderBottom: i < filtered.length - 1 ? '1px solid #f1f5f9' : 'none',
                background: isUnread ? '#fafbfc' : '#fff',
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start',
                borderLeft: isUnread ? `3px solid ${cfg.color}` : '3px solid transparent',
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
              onMouseLeave={e => e.currentTarget.style.background = isUnread ? '#fafbfc' : '#fff'}>
              <div style={{ width: 32, height: 32, borderRadius: 6, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke={cfg.color} strokeWidth={2}>
                  <path d={cfg.icon} strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 14, fontWeight: isUnread ? 600 : 500, color: PRIMARY }}>{notif.title}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <TypeBadge type={notif.type} />
                    <span style={{ fontSize: 11.5, color: GRAY }}>{timeAgo(notif.created_at)}</span>
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: '#475569', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {notif.message}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}