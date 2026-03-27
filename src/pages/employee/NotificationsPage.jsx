import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'

const PRIMARY = '#122C41'
const ACCENT  = '#1e88e5'
const FONT    = 'Lato, sans-serif'

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = (Date.now() - new Date(dateStr)) / 1000
  if (diff < 60)    return 'just now'
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

const TYPE_CONFIG = {
  INFO:    { color: '#1e88e5', bg: '#e3f2fd', label: 'Info',    icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z' },
  SUCCESS: { color: '#16a34a', bg: '#f0fdf4', label: 'Success', icon: 'M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z' },
  WARNING: { color: '#f59e0b', bg: '#fffbeb', label: 'Warning', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
  ALERT:   { color: '#ef4444', bg: '#fef2f2', label: 'Alert',   icon: 'M12 8v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z' },
}

const FILTERS = ['All', 'Unread', 'INFO', 'SUCCESS', 'WARNING', 'ALERT']

function TypeBadge({ type }) {
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.INFO
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 99, fontSize: 11.5, fontWeight: 700, color: cfg.color, background: cfg.bg, fontFamily: FONT }}>
      <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke={cfg.color} strokeWidth={2.2}>
        <path d={cfg.icon} strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      {cfg.label}
    </span>
  )
}

export default function NotificationsPage() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading]             = useState(true)
  const [filter, setFilter]               = useState('All')
  const [search, setSearch]               = useState('')

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
    const matchFilter =
      filter === 'All'    ? true :
      filter === 'Unread' ? !n.recipients?.[0]?.is_read :
                            n.type === filter
    const matchSearch = !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.message.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const unreadCount = notifications.filter(n => !n.recipients?.[0]?.is_read).length

  return (
    <div style={{ fontFamily: FONT, maxWidth: 860, margin: '0 auto' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:none } }
        * { box-sizing: border-box; }
        .notif-row:hover { background: #f8faff !important; }
      `}</style>

      {/* HEADER BANNER */}
      <div style={{ background: `linear-gradient(125deg, #0d1f30 0%, #122c41 40%, #1a4a6e 100%)`, borderRadius: 16, padding: '28px 32px', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -40, top: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,.03)' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em', fontFamily: FONT }}>
              Notifications
              {unreadCount > 0 && (
                <span style={{ marginLeft: 12, background: '#ef4444', color: '#fff', borderRadius: 99, fontSize: 14, fontWeight: 700, padding: '2px 10px', verticalAlign: 'middle' }}>
                  {unreadCount} new
                </span>
              )}
            </h1>
            <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,.5)', fontSize: 13.5 }}>
              {notifications.length} total notification{notifications.length !== 1 ? 's' : ''}
            </p>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} style={{ padding: '9px 20px', borderRadius: 9, border: '1.5px solid rgba(255,255,255,.25)', background: 'rgba(255,255,255,.1)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONT, backdropFilter: 'blur(4px)', transition: 'background .15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.18)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.1)'}>
              ✓ Mark all as read
            </button>
          )}
        </div>
      </div>

      {/* FILTERS + SEARCH */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '14px 18px', boxShadow: '0 1px 8px rgba(0,0,0,.06)', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        {/* Filter pills */}
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {FILTERS.map(f => {
            const isActive = filter === f
            const cfg = TYPE_CONFIG[f]
            return (
              <button key={f} onClick={() => setFilter(f)}
                style={{ padding: '6px 14px', borderRadius: 99, border: `1.5px solid ${isActive ? (cfg?.color || PRIMARY) : '#e5e7eb'}`, background: isActive ? (cfg?.bg || PRIMARY) : '#fff', color: isActive ? (cfg?.color || '#fff') : '#6b7280', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: FONT, transition: 'all .12s' }}>
                {f}
                {f === 'Unread' && unreadCount > 0 && <span style={{ marginLeft: 5, background: '#ef4444', color: '#fff', borderRadius: 99, fontSize: 10, padding: '0 5px' }}>{unreadCount}</span>}
              </button>
            )
          })}
        </div>
        {/* Search */}
        <div style={{ position: 'relative', minWidth: 220 }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth={2} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notifications…"
            style={{ paddingLeft: 33, paddingRight: 14, paddingTop: 9, paddingBottom: 9, border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 13, fontFamily: FONT, color: '#374151', width: '100%', outline: 'none' }} />
        </div>
      </div>

      {/* LIST */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 8px rgba(0,0,0,.06)', overflow: 'hidden', animation: 'fadeUp .3s ease' }}>
        {loading ? (
          <div style={{ padding: 56, textAlign: 'center', color: '#9ca3af' }}>
            <div style={{ width: 22, height: 22, border: '2.5px solid #e5e7eb', borderTopColor: PRIMARY, borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 12px' }} />
            Loading notifications…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <svg width="44" height="44" fill="none" viewBox="0 0 24 24" stroke="#d1d5db" strokeWidth={1.2} style={{ margin: '0 auto 14px', display: 'block' }}>
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#9ca3af', fontFamily: FONT }}>No notifications found</p>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#d1d5db', fontFamily: FONT }}>
              {filter !== 'All' ? 'Try a different filter' : 'You\'re all caught up!'}
            </p>
          </div>
        ) : filtered.map((notif, i) => {
          const isUnread = !notif.recipients?.[0]?.is_read
          const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.INFO
          return (
            <div key={notif.id} className="notif-row" onClick={() => markRead(notif)}
              style={{
                padding: '16px 22px', cursor: 'pointer',
                borderBottom: i < filtered.length - 1 ? '1px solid #f3f4f6' : 'none',
                background: isUnread ? `${cfg.bg}66` : '#fff',
                display: 'flex', gap: 16, alignItems: 'flex-start',
                transition: 'background .12s',
                borderLeft: isUnread ? `3px solid ${cfg.color}` : '3px solid transparent',
              }}>
              {/* Type icon */}
              <div style={{ width: 38, height: 38, borderRadius: 10, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={cfg.color} strokeWidth={2}>
                  <path d={cfg.icon} strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 5, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: isUnread ? 700 : 600, color: '#111827', fontFamily: FONT }}>{notif.title}</span>
                    <TypeBadge type={notif.type} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {isUnread && <span style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />}
                    <span style={{ fontSize: 12, color: '#9ca3af', fontFamily: FONT, whiteSpace: 'nowrap' }}>{timeAgo(notif.created_at)}</span>
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: 13.5, color: isUnread ? '#374151' : '#6b7280', fontFamily: FONT, lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {notif.message}
                </p>
              </div>

              {/* Arrow */}
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#d1d5db" strokeWidth={2} style={{ flexShrink: 0, marginTop: 10 }}>
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          )
        })}
      </div>
    </div>
  )
}