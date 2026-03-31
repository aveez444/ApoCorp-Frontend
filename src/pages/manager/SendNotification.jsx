import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'

const PRIMARY = '#1a1a2e'
const ACCENT = '#2d6a4f'
const GRAY = '#6c757d'

const TYPE_OPTIONS = [
  { value: 'INFO', label: 'Info', color: '#2b6cb0', bg: '#ebf4ff', desc: 'General information' },
  { value: 'SUCCESS', label: 'Success', color: '#2f855a', bg: '#e6f7ed', desc: 'Positive updates' },
  { value: 'WARNING', label: 'Warning', color: '#c05621', bg: '#ffefdb', desc: 'Attention needed' },
  { value: 'ALERT', label: 'Alert', color: '#c53030', bg: '#fee2e2', desc: 'Urgent action' },
]

const TYPE_ICONS = {
  INFO: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
  SUCCESS: 'M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
  WARNING: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  ALERT: 'M12 8v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z',
}
// Sent Notification Detail Modal Component (inside SendNotification.jsx)
// Add the isValidUrl helper function at the top of SendNotification.jsx
function isValidUrl(string) {
  try {
    if (string.includes('://')) {
      new URL(string)
      return true
    }
    const urlPattern = /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(\/.*)?$|^localhost(:\d+)?(\/.*)?$|^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?(\/.*)?$/
    return urlPattern.test(string)
  } catch {
    return false
  }
}

// Updated SentNotificationDetail Modal Component
function SentNotificationDetail({ notif, onClose }) {
  const navigate = useNavigate()
  const cfg = TYPE_OPTIONS.find(t => t.value === notif.type) || TYPE_OPTIONS[0]
  const recipientCount = notif.recipients?.length ?? 0
  const readCount = notif.recipients?.filter(r => r.is_read).length ?? 0

  const handleLinkClick = () => {
    if (!notif?.link) return
    
    let cleanLink = notif.link.trim()
    
    // Check if it's an external URL with protocol
    if (cleanLink.startsWith('http://') || cleanLink.startsWith('https://')) {
      window.open(cleanLink, '_blank', 'noopener noreferrer')
      return
    }
    
    // Check if it's a domain without protocol (like oringandseal.com)
    if (isValidUrl(cleanLink)) {
      window.open(`https://${cleanLink}`, '_blank', 'noopener noreferrer')
      return
    }
    
    // Check if it's a relative path (starts with /)
    if (cleanLink.startsWith('/')) {
      const path = cleanLink.substring(1)
      navigate(`/${path}`)
      onClose()
      return
    }
    
    // If it contains dots and no spaces, likely a URL missing protocol
    if (cleanLink.includes('.') && !cleanLink.includes(' ')) {
      const confirmOpen = window.confirm(`"${cleanLink}" appears to be a website. Open it in a new tab?`)
      if (confirmOpen) {
        window.open(`https://${cleanLink}`, '_blank', 'noopener noreferrer')
      }
    } else {
      navigate(`/${cleanLink}`)
      onClose()
    }
  }

  const isExternalLink = notif.link && (notif.link.startsWith('http://') || notif.link.startsWith('https://') || isValidUrl(notif.link.trim()))

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999 }} />
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 500,
        maxWidth: '90vw',
        maxHeight: '80vh',
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
        zIndex: 1000,
        overflow: 'auto'
      }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 6, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke={cfg.color} strokeWidth={2}>
                <path d={TYPE_ICONS[notif.type]} strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: cfg.color, background: cfg.bg, padding: '2px 8px', borderRadius: 4 }}>{cfg.label}</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: GRAY }}>×</button>
        </div>
        
        <div style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 600, color: PRIMARY }}>{notif.title}</h3>
          <p style={{ margin: '0 0 20px 0', fontSize: 13.5, color: '#475569', lineHeight: 1.5 }}>{notif.message}</p>
          
          {notif.link && notif.link.trim() !== '' && (
            <div style={{ marginBottom: 20, padding: '12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: GRAY, marginBottom: 6 }}>
                {isExternalLink ? 'External Link' : 'Related Page'}
              </div>
              <button 
                onClick={handleLinkClick}
                style={{ 
                  fontSize: 12.5, 
                  color: cfg.color, 
                  background: `${cfg.color}10`,
                  border: 'none',
                  cursor: 'pointer', 
                  fontWeight: 500, 
                  padding: '8px 12px',
                  borderRadius: 6,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  width: 'auto'
                }}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  {isExternalLink ? (
                    <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" strokeLinecap="round" strokeLinejoin="round"/>
                  ) : (
                    <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.102m1.858-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" strokeLinecap="round" strokeLinejoin="round"/>
                  )}
                </svg>
                {notif.link.length > 50 ? notif.link.substring(0, 50) + '...' : notif.link}
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  {isExternalLink ? (
                    <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" strokeLinecap="round" strokeLinejoin="round"/>
                  ) : (
                    <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                  )}
                </svg>
              </button>
              <p style={{ fontSize: 11, color: GRAY, marginTop: 6, marginBottom: 0 }}>
                {isExternalLink ? 'Opens in a new tab' : 'Navigates within the app'}
              </p>
            </div>
          )}
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 500, color: GRAY, marginBottom: 4 }}>Sent</div>
              <div style={{ fontSize: 12, color: PRIMARY }}>{new Date(notif.created_at).toLocaleString()}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 500, color: GRAY, marginBottom: 4 }}>Status</div>
              <div style={{ fontSize: 12, color: PRIMARY }}>{readCount}/{recipientCount} read</div>
            </div>
          </div>
          
          {notif.is_broadcast ? (
            <div style={{ padding: '8px 12px', background: '#f1f5f9', borderRadius: 6, fontSize: 12, color: GRAY }}>
              📢 Broadcast to all employees
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 11, fontWeight: 500, color: GRAY, marginBottom: 8 }}>Recipients ({recipientCount})</div>
              <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 6 }}>
                {notif.recipients?.map((r, i) => (
                  <div key={i} style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', fontSize: 12, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: PRIMARY }}>{r.username || r.user?.username || `User ${r.id}`}</span>
                    <span style={{ color: r.is_read ? '#2f855a' : GRAY, fontSize: 11 }}>
                      {r.is_read ? '✓ Read' : '○ Unread'}
                      {r.read_at && r.is_read && <span style={{ fontSize: 10, marginLeft: 4 }}>({new Date(r.read_at).toLocaleDateString()})</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function HistoryRow({ notif, onClick }) {
  const cfg = TYPE_OPTIONS.find(t => t.value === notif.type) || TYPE_OPTIONS[0]
  const recipientCount = notif.recipients?.length ?? 0
  const readCount = notif.recipients?.filter(r => r.is_read).length ?? 0

  return (
    <div 
      onClick={() => onClick(notif)}
      style={{ 
        padding: '12px 0', 
        borderBottom: '1px solid #f1f5f9', 
        display: 'flex', 
        alignItems: 'center', 
        gap: 12,
        cursor: 'pointer',
        transition: 'background 0.2s'
      }}
      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <div style={{ width: 32, height: 32, borderRadius: 6, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke={cfg.color} strokeWidth={2}>
          <path d={TYPE_ICONS[notif.type]} strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: PRIMARY, marginBottom: 2 }}>{notif.title}</div>
        <div style={{ fontSize: 11.5, color: GRAY }}>{notif.message?.slice(0, 60)}{notif.message?.length > 60 ? '...' : ''}</div>
      </div>
      <div style={{ fontSize: 11, color: GRAY, textAlign: 'right' }}>
        <div>{readCount}/{recipientCount} read</div>
        <div style={{ fontSize: 10, marginTop: 2 }}>{notif.created_at ? new Date(notif.created_at).toLocaleDateString() : ''}</div>
      </div>
    </div>
  )
}

export default function SendNotification() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [link, setLink] = useState('')
  const [type, setType] = useState('INFO')
  const [isBroadcast, setBroadcast] = useState(true)
  const [selectedUsers, setSelectedUsers] = useState([])
  const [userSearch, setUserSearch] = useState('')
  const [employees, setEmployees] = useState([])
  const [history, setHistory] = useState([])
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [selectedNotif, setSelectedNotif] = useState(null)

  const fetchData = useCallback(async () => {
    try {
      const [empRes, histRes] = await Promise.all([
        api.get('/accounts/users/?role=employee'),
        api.get('/notifications/sent/').catch(() => ({ data: [] })),
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
    if (!title.trim()) { setError('Title is required'); return }
    if (!message.trim()) { setError('Message is required'); return }
    if (!isBroadcast && selectedUsers.length === 0) { setError('Select at least one recipient'); return }

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
      setError(e.response?.data ? JSON.stringify(e.response.data) : 'Failed to send')
    } finally {
      setSending(false)
    }
  }

  const handleHistoryClick = (notif) => {
    setSelectedNotif(notif)
  }

  const selectedType = TYPE_OPTIONS.find(t => t.value === type) || TYPE_OPTIONS[0]
  const filteredEmployees = employees.filter(emp =>
    !userSearch ||
    emp.username?.toLowerCase().includes(userSearch.toLowerCase()) ||
    emp.email?.toLowerCase().includes(userSearch.toLowerCase())
  )

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Back Button */}
      <button 
        onClick={() => navigate('/manager/dashboard')}
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
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: PRIMARY }}>Send Notification</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: GRAY }}>Compose and send to your team</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
        {/* LEFT - Compose */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Type selector */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '20px' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: PRIMARY, marginBottom: 14 }}>Type</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {TYPE_OPTIONS.map(t => (
                <button key={t.value} onClick={() => setType(t.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: `1px solid ${type === t.value ? t.color : '#e2e8f0'}`,
                    background: type === t.value ? t.bg : '#fff',
                    color: type === t.value ? t.color : PRIMARY,
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Compose form */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '20px' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: PRIMARY, marginBottom: 14 }}>Compose</div>
            
            <input 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="Title"
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13, marginBottom: 14 }} />
            
            <textarea 
              value={message} 
              onChange={e => setMessage(e.target.value)} 
              placeholder="Message" 
              rows={4}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13, marginBottom: 14, resize: 'vertical' }} />
            
            <input 
              value={link} 
              onChange={e => setLink(e.target.value)} 
              placeholder="Link (optional)"
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13 }} />
          </div>

          {/* Audience */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '20px' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: PRIMARY, marginBottom: 14 }}>Recipients</div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <button onClick={() => setBroadcast(true)}
                style={{ flex: 1, padding: '8px', borderRadius: 6, border: `1px solid ${isBroadcast ? ACCENT : '#e2e8f0'}`, background: isBroadcast ? `${ACCENT}10` : '#fff', color: isBroadcast ? ACCENT : PRIMARY, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                All Employees
              </button>
              <button onClick={() => setBroadcast(false)}
                style={{ flex: 1, padding: '8px', borderRadius: 6, border: `1px solid ${!isBroadcast ? ACCENT : '#e2e8f0'}`, background: !isBroadcast ? `${ACCENT}10` : '#fff', color: !isBroadcast ? ACCENT : PRIMARY, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                Select Specific
              </button>
            </div>

            {!isBroadcast && (
              <>
                <input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search employees..."
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12, marginBottom: 12 }} />

                {selectedUsers.length > 0 && (
                  <div style={{ marginBottom: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {selectedUsers.map(uid => {
                      const emp = employees.find(e => e.id === uid)
                      return (
                        <span key={uid} style={{ padding: '2px 8px', background: '#f1f5f9', borderRadius: 4, fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                          {emp?.username || uid}
                          <button onClick={() => toggleUser(uid)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: GRAY }}>×</button>
                        </span>
                      )
                    })}
                  </div>
                )}

                <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #f1f5f9', borderRadius: 6 }}>
                  {filteredEmployees.length === 0 ? (
                    <div style={{ padding: 16, textAlign: 'center', color: GRAY, fontSize: 12 }}>No employees found</div>
                  ) : filteredEmployees.map(emp => {
                    const isSelected = selectedUsers.includes(emp.id)
                    return (
                      <div key={emp.id} onClick={() => toggleUser(emp.id)}
                        style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', background: isSelected ? '#fafbfc' : '#fff' }}>
                        <div>
                          <div style={{ fontSize: 12.5, fontWeight: 500, color: PRIMARY }}>{emp.username}</div>
                          <div style={{ fontSize: 10.5, color: GRAY }}>{emp.email}</div>
                        </div>
                        <div style={{ width: 16, height: 16, borderRadius: 3, border: `1px solid ${isSelected ? ACCENT : '#cbd5e1'}`, background: isSelected ? ACCENT : '#fff' }}>
                          {isSelected && <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10 }}>✓</div>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          {error && (
            <div style={{ padding: '10px 14px', background: '#fee2e2', borderRadius: 6, fontSize: 12, color: '#c53030' }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{ padding: '10px 14px', background: '#e6f7ed', borderRadius: 6, fontSize: 12, color: '#2f855a' }}>
              ✓ Notification sent successfully!
            </div>
          )}

          <button onClick={handleSend} disabled={sending}
            style={{ padding: '12px', borderRadius: 6, border: 'none', background: sending ? GRAY : ACCENT, color: '#fff', fontSize: 13, fontWeight: 600, cursor: sending ? 'not-allowed' : 'pointer' }}>
            {sending ? 'Sending...' : `Send ${isBroadcast ? 'to All' : `to ${selectedUsers.length} Employee${selectedUsers.length !== 1 ? 's' : ''}`}`}
          </button>
        </div>

        {/* RIGHT - Preview & History */}
        <div>
          {/* Preview */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '20px', marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: PRIMARY, marginBottom: 14 }}>Preview</div>
            <div style={{ border: `1px solid ${selectedType.bg}`, borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ background: selectedType.bg, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke={selectedType.color} strokeWidth={2}>
                    <path d={TYPE_ICONS[type]} strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: PRIMARY }}>{title || 'Title'}</div>
                  <div style={{ fontSize: 12, color: GRAY }}>{message || 'Message preview...'}</div>
                </div>
              </div>
            </div>
            <div style={{ marginTop: 12, padding: '8px 12px', background: '#f8fafc', borderRadius: 6 }}>
              <span style={{ fontSize: 11.5, color: GRAY }}>
                {isBroadcast ? `📢 ${employees.length} employees` : `👤 ${selectedUsers.length} selected`}
              </span>
            </div>
          </div>

          {/* Recently Sent */}
          {history.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '20px' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: PRIMARY, marginBottom: 14 }}>Recently Sent</div>
              {history.slice(0, 5).map(n => (
                <HistoryRow key={n.id} notif={n} onClick={handleHistoryClick} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedNotif && (
        <SentNotificationDetail 
          notif={selectedNotif} 
          onClose={() => setSelectedNotif(null)} 
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        input:focus, textarea:focus { outline: none; border-color: ${ACCENT}; }
      `}</style>
    </div>
  )
}