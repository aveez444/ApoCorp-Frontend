import { useEffect, useState, useCallback } from 'react'
import api from '../../api/axios'

const PRIMARY = '#122C41'
const ACCENT  = '#1e88e5'
const FONT    = 'Lato, sans-serif'

const TYPE_OPTIONS = [
  { value: 'INFO',    label: 'Info',    color: '#1e88e5', bg: '#e3f2fd', desc: 'General information' },
  { value: 'SUCCESS', label: 'Success', color: '#16a34a', bg: '#f0fdf4', desc: 'Good news or completion' },
  { value: 'WARNING', label: 'Warning', color: '#f59e0b', bg: '#fffbeb', desc: 'Caution or attention needed' },
  { value: 'ALERT',   label: 'Alert',   color: '#ef4444', bg: '#fef2f2', desc: 'Urgent action required' },
]

const TYPE_ICONS = {
  INFO:    'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
  SUCCESS: 'M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
  WARNING: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  ALERT:   'M12 8v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z',
}

function FInput({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div style={{ position: 'relative' }}>
      <span style={{ position: 'absolute', top: -9, left: 10, background: '#fff', padding: '0 4px', fontSize: 11, fontWeight: 600, color: '#9ca3af', fontFamily: FONT, zIndex: 1, letterSpacing: '.04em', textTransform: 'uppercase' }}>{label}</span>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 13.5, fontFamily: FONT, color: '#111827', background: '#fff', boxSizing: 'border-box', outline: 'none', transition: 'border .15s' }}
        onFocus={e => e.target.style.borderColor = ACCENT}
        onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
    </div>
  )
}

/* ── Sent Notification History Row ──────────────────────────────── */
function HistoryRow({ notif }) {
  const cfg = TYPE_OPTIONS.find(t => t.value === notif.type) || TYPE_OPTIONS[0]
  const recipientCount = notif.recipients?.length ?? 0
  const readCount      = notif.recipients?.filter(r => r.is_read).length ?? 0

  return (
    <div style={{ padding: '14px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 36, height: 36, borderRadius: 9, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke={cfg.color} strokeWidth={2}>
          <path d={TYPE_ICONS[notif.type]} strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111827', fontFamily: FONT, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{notif.title}</div>
        <div style={{ fontSize: 12, color: '#9ca3af', fontFamily: FONT }}>{notif.message?.slice(0, 70)}{notif.message?.length > 70 ? '…' : ''}</div>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: 11.5, color: cfg.color, background: cfg.bg, padding: '2px 9px', borderRadius: 99, fontWeight: 700, fontFamily: FONT }}>{cfg.label}</span>
        <span style={{ fontSize: 12, color: '#6b7280', fontFamily: FONT, whiteSpace: 'nowrap' }}>
          {notif.is_broadcast ? 'Broadcast' : `${recipientCount} recipient${recipientCount !== 1 ? 's' : ''}`}
        </span>
        <span style={{ fontSize: 12, color: readCount > 0 ? '#16a34a' : '#9ca3af', fontFamily: FONT }}>
          {readCount}/{recipientCount} read
        </span>
        <span style={{ fontSize: 11.5, color: '#9ca3af', fontFamily: FONT }}>
          {notif.created_at ? new Date(notif.created_at).toLocaleDateString('en-IN') : ''}
        </span>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
export default function SendNotification() {
  // Form state
  const [title, setTitle]         = useState('')
  const [message, setMessage]     = useState('')
  const [link, setLink]           = useState('')
  const [type, setType]           = useState('INFO')
  const [isBroadcast, setBroadcast] = useState(true)
  const [selectedUsers, setSelectedUsers] = useState([])
  const [userSearch, setUserSearch]       = useState('')

  // Data
  const [employees, setEmployees] = useState([])
  const [history, setHistory]     = useState([])

  // UI
  const [sending, setSending]     = useState(false)
  const [success, setSuccess]     = useState(false)
  const [error, setError]         = useState('')

  const fetchData = useCallback(async () => {
    try {
      const [empRes, histRes] = await Promise.all([
        api.get('/accounts/users/?role=employee'),
        api.get('/notifications/sent/').catch(() => ({ data: [] })),  // endpoint may vary
      ])
      setEmployees(empRes.data?.results || empRes.data || [])
      setHistory(histRes.data?.results || histRes.data || [])
    } catch { /* silent */ }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const toggleUser = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    )
  }

  const handleSend = async () => {
    if (!title.trim())   { setError('Title is required.'); return }
    if (!message.trim()) { setError('Message is required.'); return }
    if (!isBroadcast && selectedUsers.length === 0) { setError('Please select at least one recipient.'); return }

    setError('')
    setSending(true)
    try {
      await api.post('/notifications/', {
        title: title.trim(),
        message: message.trim(),
        type,
        link: link.trim(),
        is_broadcast: isBroadcast,
        recipient_ids: isBroadcast ? [] : selectedUsers,
      })
      setSuccess(true)
      setTitle(''); setMessage(''); setLink('')
      setType('INFO'); setBroadcast(true); setSelectedUsers([])
      await fetchData()
      setTimeout(() => setSuccess(false), 4000)
    } catch (e) {
      setError(e.response?.data ? JSON.stringify(e.response.data) : 'Failed to send notification.')
    } finally {
      setSending(false)
    }
  }

  const selectedType = TYPE_OPTIONS.find(t => t.value === type) || TYPE_OPTIONS[0]

  const filteredEmployees = employees.filter(emp =>
    !userSearch ||
    emp.username?.toLowerCase().includes(userSearch.toLowerCase()) ||
    emp.first_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    emp.last_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    emp.email?.toLowerCase().includes(userSearch.toLowerCase())
  )

  return (
    <div style={{ fontFamily: FONT }}>
      <style>{`
        * { box-sizing: border-box; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:none } }
        @keyframes slideIn { from { opacity:0; transform:translateX(20px) } to { opacity:1; transform:none } }
        textarea:focus, input:focus { outline: none !important; }
        .emp-row:hover { background: #f0f5ff !important; }
        .type-card:hover { transform: translateY(-1px); box-shadow: 0 3px 12px rgba(0,0,0,.1) !important; }
      `}</style>

      {/* BANNER */}
      <div style={{ background: `linear-gradient(125deg, #0d1f30 0%, #122c41 40%, #1a4a6e 100%)`, borderRadius: 16, padding: '28px 32px', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -40, top: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,.03)' }} />
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em', fontFamily: FONT }}>Send Notification</h1>
        <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,.5)', fontSize: 13.5 }}>
          Compose and send notifications to your team
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 18, alignItems: 'start' }}>
        {/* LEFT — COMPOSE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Type selector */}
          <div style={{ background: '#fff', borderRadius: 12, padding: '20px 22px', boxShadow: '0 1px 8px rgba(0,0,0,.06)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 14, fontFamily: FONT }}>Notification Type</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {TYPE_OPTIONS.map(t => (
                <div key={t.value} className="type-card" onClick={() => setType(t.value)}
                  style={{ padding: '12px 14px', borderRadius: 10, border: `2px solid ${type === t.value ? t.color : '#e5e7eb'}`, background: type === t.value ? t.bg : '#fff', cursor: 'pointer', transition: 'all .15s', boxShadow: type === t.value ? `0 2px 8px ${t.color}33` : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke={type === t.value ? t.color : '#9ca3af'} strokeWidth={2}>
                      <path d={TYPE_ICONS[t.value]} strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span style={{ fontSize: 13, fontWeight: 700, color: type === t.value ? t.color : '#374151', fontFamily: FONT }}>{t.label}</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: '#9ca3af', fontFamily: FONT }}>{t.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Compose card */}
          <div style={{ background: '#fff', borderRadius: 12, padding: '20px 22px', boxShadow: '0 1px 8px rgba(0,0,0,.06)', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#000', letterSpacing: '.06em', textTransform: 'uppercase', fontFamily: FONT }}>Compose</div>
            <FInput label="Title" value={title} onChange={setTitle} placeholder="Notification title…" />
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', top: -9, left: 10, background: '#fff', padding: '0 4px', fontSize: 11, fontWeight: 600, color: '#9ca3af', fontFamily: FONT, zIndex: 1, letterSpacing: '.04em', textTransform: 'uppercase' }}>Message</span>
              <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Write your notification message here…" rows={5}
                style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 13.5, fontFamily: FONT, color: '#111827', resize: 'vertical', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = ACCENT}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
            </div>
            <FInput label="Link (optional)" value={link} onChange={setLink} placeholder="/employee/quotations or any frontend route" />
          </div>

          {/* Audience */}
          <div style={{ background: '#fff', borderRadius: 12, padding: '20px 22px', boxShadow: '0 1px 8px rgba(0,0,0,.06)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#000', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 14, fontFamily: FONT }}>Recipients</div>

            {/* Toggle */}
            <div style={{ display: 'flex', gap: 10, marginBottom: isBroadcast ? 0 : 16 }}>
              {[
                { val: true,  label: '📢  Broadcast to all employees' },
                { val: false, label: '👤  Select specific employees' },
              ].map(opt => (
                <button key={String(opt.val)} onClick={() => setBroadcast(opt.val)}
                  style={{ flex: 1, padding: '11px 16px', borderRadius: 9, border: `2px solid ${isBroadcast === opt.val ? ACCENT : '#e5e7eb'}`, background: isBroadcast === opt.val ? '#e3f2fd' : '#fff', color: isBroadcast === opt.val ? '#1565c0' : '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONT, transition: 'all .15s' }}>
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Employee selector */}
            {!isBroadcast && (
              <div style={{ animation: 'slideIn .2s ease' }}>
                <div style={{ position: 'relative', marginBottom: 10 }}>
                  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth={2} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }}>
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/>
                  </svg>
                  <input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search employees…"
                    style={{ width: '100%', paddingLeft: 32, paddingRight: 14, paddingTop: 9, paddingBottom: 9, border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box' }} />
                </div>

                {selectedUsers.length > 0 && (
                  <div style={{ marginBottom: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {selectedUsers.map(uid => {
                      const emp = employees.find(e => e.id === uid)
                      return (
                        <span key={uid} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', background: '#e3f2fd', color: '#1565c0', borderRadius: 99, fontSize: 12.5, fontWeight: 600, fontFamily: FONT }}>
                          {emp?.username || uid}
                          <button onClick={() => toggleUser(uid)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1565c0', padding: 0, fontSize: 13, lineHeight: 1 }}>×</button>
                        </span>
                      )
                    })}
                  </div>
                )}

                <div style={{ maxHeight: 240, overflowY: 'auto', border: '1px solid #f0f0f0', borderRadius: 8 }}>
                  {filteredEmployees.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: 13, fontFamily: FONT }}>No employees found</div>
                  ) : filteredEmployees.map(emp => {
                    const isSelected = selectedUsers.includes(emp.id)
                    return (
                      <div key={emp.id} className="emp-row" onClick={() => toggleUser(emp.id)}
                        style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, background: isSelected ? '#f0f5ff' : '#fff', borderBottom: '1px solid #f9fafb', transition: 'background .1s' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: isSelected ? ACCENT : '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isSelected ? '#fff' : '#6b7280', fontSize: 12, fontWeight: 700, fontFamily: FONT, flexShrink: 0 }}>
                          {(emp.username || emp.first_name || '?').slice(0, 1).toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111827', fontFamily: FONT }}>
                            {emp.first_name && emp.last_name ? `${emp.first_name} ${emp.last_name}` : emp.username}
                          </div>
                          <div style={{ fontSize: 12, color: '#9ca3af', fontFamily: FONT }}>{emp.email || emp.username}</div>
                        </div>
                        <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${isSelected ? ACCENT : '#d1d5db'}`, background: isSelected ? ACCENT : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {isSelected && (
                            <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={3}>
                              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 9, fontSize: 13.5, color: '#b91c1c', fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#ef4444" strokeWidth={2}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div style={{ padding: '12px 16px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 9, fontSize: 13.5, color: '#166534', fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#16a34a" strokeWidth={2}><path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Notification sent successfully!
            </div>
          )}

          {/* Send button */}
          <button onClick={handleSend} disabled={sending}
            style={{ padding: '14px 32px', borderRadius: 10, border: 'none', background: sending ? '#94a3b8' : `linear-gradient(135deg, ${PRIMARY}, #1a4a6e)`, color: '#fff', fontSize: 15, fontWeight: 700, cursor: sending ? 'not-allowed' : 'pointer', fontFamily: FONT, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: sending ? 'none' : `0 4px 16px ${PRIMARY}44` }}>
            {sending ? (
              <>
                <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
                Sending…
              </>
            ) : (
              <>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
                {isBroadcast ? 'Send to All Employees' : `Send to ${selectedUsers.length} Employee${selectedUsers.length !== 1 ? 's' : ''}`}
              </>
            )}
          </button>
        </div>

        {/* RIGHT — PREVIEW + HISTORY */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Preview */}
          <div style={{ background: '#fff', borderRadius: 12, padding: '20px 22px', boxShadow: '0 1px 8px rgba(0,0,0,.06)', position: 'sticky', top: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#000', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 14, fontFamily: FONT }}>Preview</div>

            <div style={{ border: `2px solid ${selectedType.bg}`, borderRadius: 12, overflow: 'hidden' }}>
              {/* Preview header */}
              <div style={{ background: selectedType.bg, padding: '14px 16px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: `${selectedType.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke={selectedType.color} strokeWidth={2}>
                    <path d={TYPE_ICONS[type]} strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#111827', fontFamily: FONT, marginBottom: 3 }}>
                    {title || <span style={{ color: '#d1d5db' }}>Notification title</span>}
                  </div>
                  <div style={{ fontSize: 12.5, color: '#6b7280', fontFamily: FONT, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {message || <span style={{ color: '#d1d5db' }}>Your message will appear here…</span>}
                  </div>
                </div>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: selectedType.color, flexShrink: 0, marginTop: 4 }} />
              </div>
              <div style={{ padding: '10px 16px', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11.5, color: '#9ca3af', fontFamily: FONT }}>just now</span>
                <span style={{ fontSize: 11.5, color: selectedType.color, fontFamily: FONT, fontWeight: 600 }}>{selectedType.label}</span>
              </div>
            </div>

            {/* Audience summary */}
            <div style={{ marginTop: 14, padding: '10px 14px', background: '#f9fafb', borderRadius: 9, border: '1px solid #f0f0f0' }}>
              <div style={{ fontSize: 12, color: '#6b7280', fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth={2}>
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {isBroadcast
                  ? <><strong>{employees.length}</strong> employees will receive this</>
                  : selectedUsers.length > 0
                    ? <><strong>{selectedUsers.length}</strong> employee{selectedUsers.length !== 1 ? 's' : ''} selected</>
                    : <span style={{ color: '#f59e0b' }}>No recipients selected</span>
                }
              </div>
            </div>
          </div>

          {/* Sent history */}
          {history.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 8px rgba(0,0,0,.06)', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#000', letterSpacing: '.06em', textTransform: 'uppercase', fontFamily: FONT }}>Recently Sent</div>
              </div>
              {history.slice(0, 5).map(n => <HistoryRow key={n.id} notif={n} />)}
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}