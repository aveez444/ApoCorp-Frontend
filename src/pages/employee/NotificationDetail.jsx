import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../api/axios'

const PRIMARY = '#122C41'
const FONT    = 'Lato, sans-serif'

const TYPE_CONFIG = {
  INFO:    { color: '#1e88e5', bg: '#e3f2fd', label: 'Info',    icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z', gradFrom: '#1e88e5', gradTo: '#42a5f5' },
  SUCCESS: { color: '#16a34a', bg: '#f0fdf4', label: 'Success', icon: 'M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z', gradFrom: '#16a34a', gradTo: '#22c55e' },
  WARNING: { color: '#f59e0b', bg: '#fffbeb', label: 'Warning', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', gradFrom: '#f59e0b', gradTo: '#fbbf24' },
  ALERT:   { color: '#ef4444', bg: '#fef2f2', label: 'Alert',   icon: 'M12 8v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z', gradFrom: '#ef4444', gradTo: '#f87171' },
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function NotificationDetail() {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const [notif, setNotif]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const r = await api.get(`/notifications/${id}/`)
        setNotif(r.data)
        // Auto mark as read
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

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, fontFamily: FONT }}>
      <div style={{ width: 24, height: 24, border: `3px solid #e5e7eb`, borderTopColor: PRIMARY, borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (!notif) return null

  const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.INFO

  return (
    <div style={{ fontFamily: FONT, maxWidth: 700, margin: '0 auto' }}>
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:none } }`}</style>

      {/* Back */}
      <button onClick={() => navigate('/employee/notifications')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 20, background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 13.5, fontFamily: FONT, fontWeight: 600, padding: '6px 0' }}
        onMouseEnter={e => e.currentTarget.style.color = PRIMARY}
        onMouseLeave={e => e.currentTarget.style.color = '#6b7280'}>
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Back to Notifications
      </button>

      {/* Card */}
      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,.08)', overflow: 'hidden', animation: 'fadeUp .3s ease' }}>

        {/* Coloured header strip */}
        <div style={{ background: `linear-gradient(135deg, ${cfg.gradFrom}, ${cfg.gradTo})`, padding: '28px 32px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -30, top: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,.1)' }} />
          <div style={{ position: 'absolute', right: 30, bottom: -50, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,.07)' }} />

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, position: 'relative' }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, backdropFilter: 'blur(4px)' }}>
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2}>
                <path d={cfg.icon} strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <span style={{ display: 'inline-block', background: 'rgba(255,255,255,.25)', color: '#fff', borderRadius: 99, fontSize: 11.5, fontWeight: 700, padding: '2px 12px', marginBottom: 8, fontFamily: FONT }}>
                {cfg.label}
              </span>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#fff', fontFamily: FONT, lineHeight: 1.3 }}>{notif.title}</h1>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '28px 32px' }}>
          {/* Message */}
          <div style={{ marginBottom: 28 }}>
            <p style={{ margin: 0, fontSize: 15.5, color: '#374151', fontFamily: FONT, lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
              {notif.message}
            </p>
          </div>

          {/* Link (if any) */}
          {notif.link && (
            <div style={{ marginBottom: 24, padding: '14px 18px', background: '#f0f5ff', borderRadius: 10, border: '1.5px solid #c7d9ff', display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#1e88e5" strokeWidth={2}>
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{ fontSize: 13.5, color: '#374151', fontFamily: FONT }}>Related link: </span>
              <button onClick={() => navigate(notif.link)}
                style={{ fontSize: 13.5, color: '#1e88e5', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: FONT, padding: 0 }}>
                {notif.link}
              </button>
            </div>
          )}

          {/* Meta */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: 'Received', value: formatDate(notif.created_at) },
              { label: 'Type', value: cfg.label },
              { label: 'Status', value: notif.recipients?.[0]?.is_read ? 'Read' : 'Unread' },
              { label: 'Read at', value: notif.recipients?.[0]?.read_at ? formatDate(notif.recipients[0].read_at) : '—' },
            ].map(item => (
              <div key={item.label} style={{ background: '#f9fafb', borderRadius: 9, padding: '12px 16px', border: '1px solid #f0f0f0' }}>
                <div style={{ fontSize: 11.5, color: '#9ca3af', fontWeight: 600, fontFamily: FONT, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 13.5, color: '#374151', fontWeight: 600, fontFamily: FONT }}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* CTA if link */}
          {notif.link && (
            <button onClick={() => navigate(notif.link)}
              style={{ marginTop: 24, width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg, ${cfg.gradFrom}, ${cfg.gradTo})`, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              Go to linked page
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}